import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

/**
 * The reference curves.
 *
 * These paths are the source the `linear()` values in base.css were generated
 * from. CSS cannot express a two-segment curve in a single `cubic-bezier()`, so
 * the stylesheet carries a sampled `linear()` approximation; here we can use the
 * real thing.
 */
export const FLOW_PATH = 'M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1';
export const FLOW_CLOSE_PATH = 'M0,0 C0.28,0.08 0.10,0.55 0.28,0.78 0.38,0.95 0.64,1 1,1';

export const EASE_FLOW = 'morphFlow';
export const EASE_FLOW_CLOSE = 'morphFlowClose';

/** `cubic-bezier(.56, .27, 0, 1)` — radius and opacity while closing. */
export const EASE_SHAPE = 'cubic-bezier(0.56, 0.27, 0, 1)';
/** `cubic-bezier(.37, .35, 0, 1)` — the window blur. */
export const EASE_BLUR = 'cubic-bezier(0.37, 0.35, 0, 1)';
/** `cubic-bezier(.33, 1, .68, 1)` — the trigger fading back in. */
export const EASE_OUT_SOFT = 'cubic-bezier(0.33, 1, 0.68, 1)';
/** `cubic-bezier(.65, 0, .35, 1)` — full-screen radius. */
export const EASE_IN_OUT_SOFT = 'cubic-bezier(0.65, 0, 0.35, 1)';

let registered = false;

/** Idempotent, and safe to call during render — it never touches the document. */
export function registerMorphEases(): void {
  if (registered) return;
  gsap.registerPlugin(CustomEase);
  CustomEase.create(EASE_FLOW, FLOW_PATH);
  CustomEase.create(EASE_FLOW_CLOSE, FLOW_CLOSE_PATH);
  registered = true;
}

/**
 * The closing curve, sampled, so the panel content can travel the same path at a
 * fraction of the speed.
 *
 * The original gives the container 500ms and the content 2000ms, then plays only
 * the first 500ms of the content's timeline. The content therefore lands short of
 * the origin and is clipped by the container closing over it. That lag is the
 * whole character of the close, so it is reproduced exactly rather than
 * approximated with a delay.
 */
export function laggedEase(fraction: number): (progress: number) => number {
  const flow = gsap.parseEase(EASE_FLOW);
  const end = flow(fraction);
  return (progress: number) => (end === 0 ? 0 : flow(progress * fraction) / end);
}

/** How far along the path the content actually gets: `flow(0.25)`, about 0.83. */
export function laggedDistance(fraction: number): number {
  return gsap.parseEase(EASE_FLOW)(fraction);
}
