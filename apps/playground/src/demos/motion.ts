export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function motionSeconds(element: Element, seconds: number): number {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue('--morph-slow'));
  return seconds * (Number.isFinite(value) && value > 0 ? value : 1);
}
import { EASE_FLOW, EASE_FLOW_CLOSE, EASE_IN_OUT_SOFT, EASE_OUT_SOFT, registerMorphEases } from '../../../../packages/morphui/src/lib/easing';

registerMorphEases();

export { EASE_FLOW, EASE_FLOW_CLOSE, EASE_IN_OUT_SOFT, EASE_OUT_SOFT };
