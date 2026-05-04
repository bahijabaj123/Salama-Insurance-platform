import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
  input
} from '@angular/core';

import { GradientTextComponent } from '../gradient-text/gradient-text.component';

export interface MagicBentoItem {
  label: string;
  title: string;
  description: string;
  color?: string;
}

const DEFAULT_PARTICLE_COUNT = 6;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255';
const MOBILE_BREAKPOINT = 768;

@Component({
  selector: 'app-magic-bento',
  standalone: true,
  imports: [GradientTextComponent],
  templateUrl: './magic-bento.component.html',
  styleUrl: './magic-bento.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MagicBentoComponent implements AfterViewInit, OnDestroy {
  readonly items = input<MagicBentoItem[]>([]);
  readonly textAutoHide = input(true);
  readonly enableStars = input(true);
  readonly enableSpotlight = input(true);
  readonly enableBorderGlow = input(true);
  readonly enableTilt = input(false);
  readonly enableMagnetism = input(false);
  readonly clickEffect = input(true);
  readonly disableAnimations = input(false);
  readonly spotlightRadius = input(DEFAULT_SPOTLIGHT_RADIUS);
  readonly particleCount = input(DEFAULT_PARTICLE_COUNT);
  readonly glowColor = input(DEFAULT_GLOW_COLOR);
  readonly defaultColor = input('#120F17');

  @ViewChild('grid', { static: false }) gridRef?: ElementRef<HTMLElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  private spotlightEl?: HTMLDivElement;
  private docMouseMove?: (e: MouseEvent) => void;
  private docMouseLeave?: () => void;
  private resizeHandler?: () => void;
  private isMobile = false;
  private cardCleanups: Array<() => void> = [];
  private spotlightRafId: number | null = null;
  private lastMouseEvent: MouseEvent | null = null;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      this.detectMobile();
      this.wireAllCards();
      if (this.enableSpotlight()) {
        this.setupSpotlight();
      }
      this.resizeHandler = () => this.detectMobile();
      window.addEventListener('resize', this.resizeHandler, { passive: true });
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.teardownSpotlight();
    this.teardownCards();
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  private get shouldDisable(): boolean {
    return this.disableAnimations() || this.isMobile;
  }

  private detectMobile(): void {
    this.isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  }

  private wireAllCards(): void {
    const grid = this.gridRef?.nativeElement;
    if (!grid) {
      return;
    }
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.magic-bento-card'));
    cards.forEach((card) => this.wireCard(card));
  }

  private teardownCards(): void {
    this.cardCleanups.forEach((fn) => fn());
    this.cardCleanups = [];
  }

  private wireCard(card: HTMLElement): void {
    let hovered = false;
    const particles: HTMLSpanElement[] = [];
    const spawnTimeouts: number[] = [];

    const spawnParticles = () => {
      const { width, height } = card.getBoundingClientRect();
      const count = this.particleCount();
      const color = this.glowColor();
      for (let i = 0; i < count; i++) {
        const tid = window.setTimeout(() => {
          if (!hovered) {
            return;
          }
          const startX = Math.random() * width;
          const startY = Math.random() * height;
          const dx = (Math.random() - 0.5) * 100;
          const dy = (Math.random() - 0.5) * 100;
          const rot = Math.random() * 360;
          const duration = 2000 + Math.random() * 2000;

          const p = document.createElement('span');
          p.className = 'magic-bento-particle';
          p.style.cssText = `
            position: absolute;
            left: ${startX}px;
            top: ${startY}px;
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: rgba(${color}, 1);
            box-shadow: 0 0 6px rgba(${color}, 0.6);
            pointer-events: none;
            z-index: 3;
            will-change: transform, opacity;
          `;
          card.appendChild(p);
          particles.push(p);

          p.animate(
            [
              { transform: 'scale(0) translate(0,0) rotate(0deg)', opacity: 0 },
              { transform: 'scale(1) translate(0,0) rotate(0deg)', opacity: 1, offset: 0.15 },
              {
                transform: `scale(1) translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
                opacity: 0.3
              }
            ],
            {
              duration,
              easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              iterations: Infinity,
              direction: 'alternate',
              fill: 'forwards'
            }
          );
        }, i * 100);
        spawnTimeouts.push(tid);
      }
    };

    const clearParticles = () => {
      spawnTimeouts.splice(0).forEach((t) => clearTimeout(t));
      particles.splice(0).forEach((p) => {
        const anim = p.animate(
          [{ opacity: 1, transform: getComputedStyle(p).transform }, { opacity: 0, transform: 'scale(0)' }],
          { duration: 300, easing: 'cubic-bezier(0.64, 0, 0.78, 0)', fill: 'forwards' }
        );
        anim.onfinish = () => p.remove();
      });
    };

    const spawnRipple = (x: number, y: number) => {
      const rect = card.getBoundingClientRect();
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      );
      const color = this.glowColor();
      const ripple = document.createElement('span');
      ripple.className = 'magic-bento-ripple';
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle,
          rgba(${color}, 0.4) 0%,
          rgba(${color}, 0.2) 30%,
          transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 4;
        will-change: transform, opacity;
      `;
      card.appendChild(ripple);
      const anim = ripple.animate(
        [
          { transform: 'scale(0)', opacity: 1 },
          { transform: 'scale(1)', opacity: 0 }
        ],
        { duration: 800, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
      );
      anim.onfinish = () => ripple.remove();
    };

    const onEnter = () => {
      if (this.shouldDisable) {
        return;
      }
      hovered = true;
      if (this.enableStars()) {
        spawnParticles();
      }
    };

    const onLeave = () => {
      hovered = false;
      clearParticles();
      if (this.enableTilt() || this.enableMagnetism()) {
        card.style.transform = '';
      }
    };

    const onMove = (e: MouseEvent) => {
      if (this.shouldDisable) {
        return;
      }
      if (!this.enableTilt() && !this.enableMagnetism()) {
        return;
      }
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      let transform = '';
      if (this.enableTilt()) {
        const rotX = ((y - cy) / cy) * -10;
        const rotY = ((x - cx) / cx) * 10;
        transform += `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) `;
      }
      if (this.enableMagnetism()) {
        const mX = (x - cx) * 0.05;
        const mY = (y - cy) * 0.05;
        transform += `translate(${mX}px, ${mY}px)`;
      }
      card.style.transform = transform;
    };

    const onClick = (e: MouseEvent) => {
      if (!this.clickEffect() || this.shouldDisable) {
        return;
      }
      const rect = card.getBoundingClientRect();
      spawnRipple(e.clientX - rect.left, e.clientY - rect.top);
    };

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mouseleave', onLeave);
    card.addEventListener('mousemove', onMove);
    card.addEventListener('click', onClick);

    this.cardCleanups.push(() => {
      card.removeEventListener('mouseenter', onEnter);
      card.removeEventListener('mouseleave', onLeave);
      card.removeEventListener('mousemove', onMove);
      card.removeEventListener('click', onClick);
      clearParticles();
    });
  }

  private setupSpotlight(): void {
    const grid = this.gridRef?.nativeElement;
    if (!grid) {
      return;
    }
    const color = this.glowColor();
    const spot = document.createElement('div');
    spot.className = 'magic-bento-spotlight';
    spot.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${color}, 0.15) 0%,
        rgba(${color}, 0.08) 15%,
        rgba(${color}, 0.04) 25%,
        rgba(${color}, 0.02) 40%,
        rgba(${color}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
      transition: opacity 300ms ease;
      will-change: left, top, opacity;
    `;
    document.body.appendChild(spot);
    this.spotlightEl = spot;

    const proximityOf = (r: number) => ({ proximity: r * 0.5, fadeDistance: r * 0.75 });

    const processMove = (e: MouseEvent) => {
      if (this.shouldDisable || !this.spotlightEl) {
        return;
      }
      const rect = grid.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      const cards = Array.from(grid.querySelectorAll<HTMLElement>('.magic-bento-card'));
      if (!inside) {
        this.spotlightEl.style.opacity = '0';
        cards.forEach((c) => c.style.setProperty('--glow-intensity', '0'));
        return;
      }
      const radius = this.spotlightRadius();
      const { proximity, fadeDistance } = proximityOf(radius);
      let minDist = Infinity;
      cards.forEach((card) => {
        const r = card.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy) - Math.max(r.width, r.height) / 2;
        const eff = Math.max(0, dist);
        minDist = Math.min(minDist, eff);
        let intensity = 0;
        if (eff <= proximity) {
          intensity = 1;
        } else if (eff <= fadeDistance) {
          intensity = (fadeDistance - eff) / (fadeDistance - proximity);
        }
        const relX = ((e.clientX - r.left) / r.width) * 100;
        const relY = ((e.clientY - r.top) / r.height) * 100;
        card.style.setProperty('--glow-x', `${relX}%`);
        card.style.setProperty('--glow-y', `${relY}%`);
        card.style.setProperty('--glow-intensity', `${intensity}`);
        card.style.setProperty('--glow-radius', `${radius}px`);
      });
      this.spotlightEl.style.left = `${e.clientX}px`;
      this.spotlightEl.style.top = `${e.clientY}px`;
      const targetOp =
        minDist <= proximity
          ? 0.8
          : minDist <= fadeDistance
            ? ((fadeDistance - minDist) / (fadeDistance - proximity)) * 0.8
            : 0;
      this.spotlightEl.style.opacity = `${targetOp}`;
    };

    /**
     * mousemove can fire 100s of times per second on fast devices. We coalesce
     * all events that happened during the current frame and only run the layout
     * work once per rAF tick — keeps the page at 60 fps.
     */
    const handleMove = (e: MouseEvent) => {
      this.lastMouseEvent = e;
      if (this.spotlightRafId !== null) {
        return;
      }
      this.spotlightRafId = requestAnimationFrame(() => {
        this.spotlightRafId = null;
        if (this.lastMouseEvent) {
          processMove(this.lastMouseEvent);
        }
      });
    };

    const handleLeave = () => {
      if (this.spotlightEl) {
        this.spotlightEl.style.opacity = '0';
      }
      grid.querySelectorAll<HTMLElement>('.magic-bento-card').forEach((c) => {
        c.style.setProperty('--glow-intensity', '0');
      });
    };

    this.docMouseMove = handleMove;
    this.docMouseLeave = handleLeave;
    document.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);
  }

  private teardownSpotlight(): void {
    if (this.docMouseMove) {
      document.removeEventListener('mousemove', this.docMouseMove);
    }
    if (this.docMouseLeave) {
      document.removeEventListener('mouseleave', this.docMouseLeave);
    }
    if (this.spotlightRafId !== null) {
      cancelAnimationFrame(this.spotlightRafId);
      this.spotlightRafId = null;
    }
    this.lastMouseEvent = null;
    this.spotlightEl?.remove();
    this.spotlightEl = undefined;
  }
}
