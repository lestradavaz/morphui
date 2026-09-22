import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

/*
 * Every curve the reference components use, registered with GSAP.
 *
 * The two flow paths are the source that the `linear()` values in base.css were
 * generated from - CSS cannot express a two-segment curve in one
 * `cubic-bezier()`, so the stylesheet carries a sampled approximation while the
 * real definitions live here.
 *
 * The rest were plain `cubic-bezier()` in CSS. GSAP does not parse that notation,
 * so each is written as the equivalent path: cubic-bezier(x1,y1,x2,y2) is
 * `M0,0 C x1,y1 x2,y2 1,1`.
 */

export const EASE_FLOW = 'morphFlow';
export const EASE_FLOW_CLOSE = 'morphFlowClose';
export const EASE_SHAPE = 'morphShape';
export const EASE_BLUR = 'morphBlur';
export const EASE_IN_STRONG = 'morphInStrong';
export const EASE_OUT_SOFT = 'morphOutSoft';
export const EASE_IN_OUT_SOFT = 'morphInOutSoft';
/** The CSS keyword `ease`, which is cubic-bezier(0.25, 0.1, 0.25, 1). */
export const EASE_CSS = 'morphCss';

const PATHS: Record<string, string> = {
  [EASE_FLOW]: 'M0,0 C0.308,0.19 0.107,0.633 0.288,0.866 0.382,0.987 0.656,1 1,1',
  [EASE_FLOW_CLOSE]: 'M0,0 C0.28,0.08 0.10,0.55 0.28,0.78 0.38,0.95 0.64,1 1,1',
  [EASE_SHAPE]: 'M0,0 C0.56,0.27 0,1 1,1',
  [EASE_BLUR]: 'M0,0 C0.37,0.35 0,1 1,1',
  [EASE_IN_STRONG]: 'M0,0 C0.5,0 0.75,0 1,1',
  [EASE_OUT_SOFT]: 'M0,0 C0.33,1 0.68,1 1,1',
  [EASE_IN_OUT_SOFT]: 'M0,0 C0.65,0 0.35,1 1,1',
  [EASE_CSS]: 'M0,0 C0.25,0.1 0.25,1 1,1',
};

let registered = false;

export function registerMorphEases(): void {
  if (registered) return;
  gsap.registerPlugin(CustomEase);
  for (const [name, path] of Object.entries(PATHS)) CustomEase.create(name, path);
  registered = true;
}

/** How far along the flow curve a given fraction of the way actually gets. */
export function flowAt(fraction: number): number {
  return gsap.parseEase(EASE_FLOW)(fraction);
}
