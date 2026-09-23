export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Surface {
  background: string;
  radius: string;
  shadow: string;
}

export function box(element: Element): Box {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left, y: top, width, height };
}

export function surface(element: Element): Surface {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const declared = Number.parseFloat(style.borderTopLeftRadius) || 0;

  /*
   * A pill declares a radius far larger than it can paint - `999px` on a 52px
   * tall button renders as 26px, because the browser clamps it to half the
   * shorter side.
   *
   * Animating the declared value is therefore wrong in exactly one direction:
   * as the box grows, the clamp stops biting and the painted corners balloon
   * toward 999px while the declared value is on its way down. The panel reaches
   * full size with its corners still visibly opening out. Carrying the clamped
   * value instead means the animation starts from what the eye already sees.
   */
  const radius = Math.min(declared, rect.width / 2, rect.height / 2);

  return {
    background: style.backgroundColor,
    radius: `${radius}px`,
    shadow: style.boxShadow,
  };
}

export const lerpBox = (a: Box, b: Box, p: number): Box => ({
  x: a.x + (b.x - a.x) * p,
  y: a.y + (b.y - a.y) * p,
  width: a.width + (b.width - a.width) * p,
  height: a.height + (b.height - a.height) * p,
});

/** An element that has been laid out and is actually on screen. */
export function isMeasurable(element: Element | null | undefined): element is Element {
  return !!element && element.isConnected && element.getClientRects().length > 0;
}

/** Reads `--morph-slow`, the multiplier that stretches every duration. */
export function slowFactor(element?: Element): number {
  if (typeof document === 'undefined') return 1;
  const raw = getComputedStyle(element ?? document.documentElement).getPropertyValue('--morph-slow');
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
