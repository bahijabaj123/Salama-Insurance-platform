import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
  viewChildren
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface LogoLoopItem {
  src: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  href?: string;
}

const SMOOTH_TAU = 0.25;
const MIN_COPIES = 2;
const COPY_HEADROOM = 2;

@Component({
  selector: 'app-logo-loop',
  standalone: true,
  imports: [],
  templateUrl: './logo-loop.component.html',
  styleUrl: './logo-loop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoLoopComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly zone = inject(NgZone);

  readonly logos = input.required<LogoLoopItem[]>();
  readonly speed = input(120);
  readonly direction = input<'left' | 'right' | 'up' | 'down'>('left');
  readonly width = input<string | number>('100%');
  readonly logoHeight = input(28);
  readonly gap = input(32);
  readonly pauseOnHover = input<boolean | undefined>(undefined);
  readonly hoverSpeed = input<number | undefined>(undefined);
  readonly fadeOut = input(false);
  readonly fadeOutColor = input<string | undefined>(undefined);
  readonly scaleOnHover = input(false);
  readonly ariaLabel = input('Partner logos');

  protected readonly containerRef = viewChild<ElementRef<HTMLDivElement>>('container');
  protected readonly trackRef = viewChild<ElementRef<HTMLDivElement>>('track');
  protected readonly seqRefs = viewChildren<ElementRef<HTMLUListElement>>('seqRef');

  protected readonly seqWidth = signal(0);
  protected readonly seqHeight = signal(0);
  protected readonly copyCount = signal(MIN_COPIES);
  protected readonly isHovered = signal(false);

  protected readonly isVertical = computed(() => {
    const d = this.direction();
    return d === 'up' || d === 'down';
  });

  protected readonly effectiveHoverSpeed = computed<number | undefined>(() => {
    const hs = this.hoverSpeed();
    if (hs !== undefined) return hs;
    const ph = this.pauseOnHover();
    if (ph === true) return 0;
    if (ph === false) return undefined;
    return 0;
  });

  protected readonly targetVelocity = computed(() => {
    const speed = this.speed();
    const direction = this.direction();
    const vertical = this.isVertical();
    const magnitude = Math.abs(speed);
    const directionMultiplier = vertical
      ? direction === 'up' ? 1 : -1
      : direction === 'left' ? 1 : -1;
    const speedMultiplier = speed < 0 ? -1 : 1;
    return magnitude * directionMultiplier * speedMultiplier;
  });

  protected readonly copies = computed(() =>
    Array.from({ length: this.copyCount() }, (_, i) => i)
  );

  protected readonly widthCss = computed<string | null>(() => {
    const w = this.width();
    const css = typeof w === 'number' ? `${w}px` : w;
    if (this.isVertical() && (css === '100%' || css === undefined)) return null;
    return css ?? '100%';
  });

  private offset = 0;
  private velocity = 0;

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Observe size changes + handle image load to recompute the loop dimensions.
    effect((onCleanup) => {
      const container = this.containerRef()?.nativeElement;
      const seq = this.seqRefs()[0]?.nativeElement;

      // Touch reactive deps so the effect re-runs when they change.
      this.logos();
      this.gap();
      this.logoHeight();
      this.direction();

      if (!container || !seq) return;

      const update = () => this.updateDimensions();

      const ro = new ResizeObserver(() => update());
      ro.observe(container);
      ro.observe(seq);

      const images = Array.from(seq.querySelectorAll<HTMLImageElement>('img'));
      let remaining = images.length;
      const onImg = () => {
        remaining -= 1;
        if (remaining <= 0) update();
      };
      if (images.length === 0) {
        update();
      } else {
        for (const img of images) {
          if (img.complete) {
            onImg();
          } else {
            img.addEventListener('load', onImg, { once: true });
            img.addEventListener('error', onImg, { once: true });
          }
        }
      }

      update();

      onCleanup(() => {
        ro.disconnect();
        for (const img of images) {
          img.removeEventListener('load', onImg);
          img.removeEventListener('error', onImg);
        }
      });
    });

    // Drive the requestAnimationFrame loop outside Angular zone for performance.
    effect((onCleanup) => {
      const track = this.trackRef()?.nativeElement;
      if (!track) return;

      const isVertical = this.isVertical();
      const seqSize = isVertical ? this.seqHeight() : this.seqWidth();
      const targetVelocity = this.targetVelocity();
      const isHovered = this.isHovered();
      const effectiveHoverSpeed = this.effectiveHoverSpeed();

      if (seqSize > 0) {
        this.offset = ((this.offset % seqSize) + seqSize) % seqSize;
        track.style.transform = isVertical
          ? `translate3d(0, ${-this.offset}px, 0)`
          : `translate3d(${-this.offset}px, 0, 0)`;
      }

      let rafId: number | null = null;
      let lastTimestamp: number | null = null;

      const animate = (timestamp: number) => {
        if (lastTimestamp === null) lastTimestamp = timestamp;
        const dt = Math.max(0, timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;

        const target =
          isHovered && effectiveHoverSpeed !== undefined
            ? effectiveHoverSpeed
            : targetVelocity;
        const easing = 1 - Math.exp(-dt / SMOOTH_TAU);
        this.velocity += (target - this.velocity) * easing;

        if (seqSize > 0) {
          let next = this.offset + this.velocity * dt;
          next = ((next % seqSize) + seqSize) % seqSize;
          this.offset = next;
          track.style.transform = isVertical
            ? `translate3d(0, ${-this.offset}px, 0)`
            : `translate3d(${-this.offset}px, 0, 0)`;
        }

        rafId = requestAnimationFrame(animate);
      };

      this.zone.runOutsideAngular(() => {
        rafId = requestAnimationFrame(animate);
      });

      onCleanup(() => {
        if (rafId !== null) cancelAnimationFrame(rafId);
      });
    });
  }

  private updateDimensions(): void {
    const container = this.containerRef()?.nativeElement;
    const seq = this.seqRefs()[0]?.nativeElement;
    if (!container || !seq) return;

    const containerWidth = container.clientWidth;
    const rect = seq.getBoundingClientRect();
    const sequenceWidth = rect.width;
    const sequenceHeight = rect.height;

    if (this.isVertical()) {
      const parentHeight = container.parentElement?.clientHeight ?? 0;
      if (parentHeight > 0) {
        const target = Math.ceil(parentHeight);
        if (container.style.height !== `${target}px`) {
          container.style.height = `${target}px`;
        }
      }
      if (sequenceHeight > 0) {
        this.seqHeight.set(Math.ceil(sequenceHeight));
        const viewport = container.clientHeight || parentHeight || sequenceHeight;
        const copies = Math.ceil(viewport / sequenceHeight) + COPY_HEADROOM;
        this.copyCount.set(Math.max(MIN_COPIES, copies));
      }
    } else if (sequenceWidth > 0) {
      this.seqWidth.set(Math.ceil(sequenceWidth));
      const copies = Math.ceil(containerWidth / sequenceWidth) + COPY_HEADROOM;
      this.copyCount.set(Math.max(MIN_COPIES, copies));
    }
  }

  protected onMouseEnter(): void {
    if (this.effectiveHoverSpeed() !== undefined) this.isHovered.set(true);
  }

  protected onMouseLeave(): void {
    if (this.effectiveHoverSpeed() !== undefined) this.isHovered.set(false);
  }
}
