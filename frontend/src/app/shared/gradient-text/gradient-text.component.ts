import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type GradientTextDirection = 'horizontal' | 'vertical' | 'diagonal';

/**
 * Angular port of the React GradientText component.
 *
 * NOTE: To keep the page at 60 fps even with multiple instances on screen,
 * the gradient is animated **purely with a CSS keyframe** that animates
 * `background-position`. No `requestAnimationFrame` loop runs in JS, so
 * adding more instances does not cost any extra main-thread work.
 *
 * Public API stays compatible with the React reference:
 *   <app-gradient-text
 *     [colors]="['#5227FF','#FF9FFC','#B497CF']"
 *     [animationSpeed]="8"
 *     [showBorder]="false"
 *     direction="horizontal"
 *     [pauseOnHover]="false"
 *     [yoyo]="true"
 *   >Add a splash of color!</app-gradient-text>
 */
@Component({
  selector: 'app-gradient-text',
  standalone: true,
  imports: [],
  templateUrl: './gradient-text.component.html',
  styleUrl: './gradient-text.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GradientTextComponent {
  readonly colors = input<string[]>(['#5227FF', '#FF9FFC', '#B497CF']);
  /** Animation duration in seconds for one half-cycle (yoyo) or full loop. */
  readonly animationSpeed = input(8);
  readonly showBorder = input(false);
  readonly direction = input<GradientTextDirection>('horizontal');
  readonly pauseOnHover = input(false);
  readonly yoyo = input(true);

  /** Repeat the first color at the end so the loop is seamless. */
  readonly gradientColors = computed(() => {
    const list = this.colors();
    if (!Array.isArray(list) || list.length === 0) {
      return '#5227FF, #FF9FFC, #B497CF, #5227FF';
    }
    return [...list, list[0]].join(', ');
  });

  readonly gradientAngle = computed<string>(() => {
    switch (this.direction()) {
      case 'vertical':
        return 'to bottom';
      case 'diagonal':
        return 'to bottom right';
      case 'horizontal':
      default:
        return 'to right';
    }
  });

  readonly backgroundImage = computed(
    () => `linear-gradient(${this.gradientAngle()}, ${this.gradientColors()})`
  );

  readonly backgroundSize = computed<string>(() => {
    switch (this.direction()) {
      case 'vertical':
        return '100% 300%';
      case 'diagonal':
        return '300% 300%';
      case 'horizontal':
      default:
        return '300% 100%';
    }
  });

  /**
   * Yoyo uses CSS `animation-direction: alternate` (so each leg lasts `speed`
   * seconds). A non-yoyo "continuous" loop covers the same distance once per
   * `2 * speed` seconds, matching the React reference.
   */
  readonly animationDuration = computed<string>(() => {
    const base = Math.max(0.1, this.animationSpeed());
    return `${this.yoyo() ? base : base * 2}s`;
  });

  readonly animationName = computed<string>(() => {
    switch (this.direction()) {
      case 'vertical':
        return 'agt-shift-v';
      case 'horizontal':
      case 'diagonal':
      default:
        return 'agt-shift-h';
    }
  });

  readonly animationDirection = computed<string>(() => (this.yoyo() ? 'alternate' : 'normal'));
}
