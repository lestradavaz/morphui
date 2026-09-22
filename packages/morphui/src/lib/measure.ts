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
  return {
    background: style.backgroundColor,
    radius: style.borderTopLeftRadius,
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
export function slowFactor(): number {
  if (typeof document === 'undefined') return 1;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--morph-slow');
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
