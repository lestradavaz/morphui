import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

import { EASE_FLOW, EASE_FLOW_CLOSE, EASE_OUT_SOFT, registerMorphEases } from './easing.js';
import { box, prefersReducedMotion, slowFactor, surface, type Box } from './measure.js';
import { anchorLayer, buildFlight, driveShape, measureFlight, settle } from './morph-engine.js';

/*
 * An anchored surface - a dropdown, a combobox list, a popover, a context menu -
 * is the dialog's morph on a shorter leash.
 *
 * The panel still grows out of the box it was opened from, still borrows that
 * box's fill and shadow for the first beat, still carries its content on its own
 * transform instead of reflowing it, and still lands its corners by dividing the
 * radius back out per axis. What changes is the clock: a dialog crosses most of
 * the viewport, an anchored surface crosses one trigger's height, and the
 * dialog's 700ms over that distance reads as molasses. The curves are the same
 * ones, and so is the appearance layer - the classes toggled here are the ones
 * the stylesheet already dresses for `.morph-panel-content`.
 *
 * It is a sibling of `openMorph` rather than a mode of it because a dialog is a
 * modal `<dialog>` in the top layer and these are not: a combobox list must not
 * make the page behind it inert, and a context menu must not tint the viewport.
 */

const OPEN = 460;
const CLOSE = 360;
/** The beat the fill, the shadow and the corners run on, inside the geometry. */
const SURFACE = 220;
/** The last stretch of a close, where the surface hands its box back. */
const HANDOVER = 140;
const GENTLE = 150;

let ready = false;
let uid = 0;

function ensure(): void {
  if (ready) return;
  gsap.registerPlugin(Flip);
  registerMorphEases();
  ready = true;
}

export interface AnchoredParts {
  /** The element the surface grows out of, and shrinks back onto. */
  trigger: HTMLElement;
  /** Fixed-positioned, and laid out at the box it is morphing towards. */
  surface: HTMLElement;
  /** The surface's only child. Carries the surface's transform, never its own. */
  content: HTMLElement;
  /** An untransformed container for the layers the flight is drawn in. */
  host: HTMLElement;
}

export interface AnchoredConfig {
  /**
   * The box to grow out of, when that is not the trigger's own - a click point,
   * or a list row the trigger stands in for.
   */
  origin?: Box | null;
  /** Fly the trigger's words into the element marked `data-morph-words`. */
  shareWords?: boolean;
}

/**
 * The radius a box can actually paint. A trigger declares one and is clamped by
 * its own height; a click point declares nothing, so the surface starts square
 * and opens out of a dot.
 */
function clampedRadius(declared: number, at: Box): number {
  return Math.min(declared, at.width / 2, at.height / 2);
}

/** A shadow of no size, for an end that declares none and cannot be interpolated. */
function shadowOf(value: string): string {
  return value === 'none' ? 'rgba(0, 0, 0, 0) 0px 0px 0px 0px' : value;
}

/**
 * Everything a transition writes to the surface, and nothing else.
 *
 * A dialog panel can be cleared outright - its box comes from the stylesheet, so
 * there is nothing to lose. An anchored surface's box is chosen by the page at
 * the moment it opens and written straight onto the element, so a blanket clear
 * takes the panel's position with it and drops it wherever the flow puts it.
 * What the engine owns is the transform and the appearance; the box is the
 * caller's, and is left alone.
 */
const TRANSITION = 'transform, transformOrigin, borderRadius, backgroundColor, boxShadow, opacity';

function clearTransition(el: HTMLElement | null | undefined): void {
  if (el) gsap.set(el, { clearProps: TRANSITION });
}

export function openAnchoredSurface(parts: AnchoredParts, config: AnchoredConfig = {}): Promise<void> {
  ensure();
  const { trigger, surface: el, content, host } = parts;
  const ms = (value: number) => (value / 1000) * slowFactor(el);
  const origin = config.origin ?? box(trigger);

  if (prefersReducedMotion()) {
    // Opacity, not geometry: the surface is already at its box, so all that is
    // left is for it to arrive.
    const tl = gsap.timeline();
    tl.from(el, { opacity: 0, duration: ms(GENTLE), ease: 'power2.out' }, 0);
    return settle(tl, () => clearTransition(el));
  }

  // Flip pairs the two by id: the origin's box becomes the surface's first box.
  const id = `morph-anchor-${++uid}`;
  trigger.dataset['flipId'] = id;
  el.dataset['flipId'] = id;

  const originSurface = surface(trigger);
  const state = Flip.getState(trigger);

  const to = box(el);
  const toRadius = Number.parseFloat(surface(el).radius) || 0;

  // Before anything is transformed.
  const plan = measureFlight(trigger, el, !!config.shareWords, 'open');
  anchorLayer(content);

  const tl = Flip.from(state, {
    targets: el,
    scale: true,
    duration: ms(OPEN),
    ease: EASE_FLOW,
    toggleClass: 'morph-opening',
  });

  driveShape(tl, el, {
    fromScale: { x: origin.width / to.width, y: origin.height / to.height },
    toScale: { x: 1, y: 1 },
    fromRadius: clampedRadius(Number.parseFloat(originSurface.radius) || 0, origin),
    toRadius,
    geoDuration: ms(OPEN),
    geoEase: EASE_FLOW,
    // The corners meet the origin's radius on a beat of their own, the way a
    // dialog's do: on the geometry's clock they would still be opening out when
    // the box had already landed.
    radiusDuration: ms(SURFACE),
    radiusEase: EASE_FLOW,
  });

  /*
   * The surface wears the origin's fill and shadow for the first beat. That is
   * what makes the change read as one element resizing rather than two handing
   * over, and it is the piece a plain box-grow animation cannot fake.
   */
  tl.from(
    el,
    { backgroundColor: originSurface.background, boxShadow: shadowOf(originSurface.shadow), duration: ms(SURFACE), ease: EASE_FLOW },
    0,
  );

  // The trigger stays on screen beside the surface it opened, so it keeps its
  // words: the flight carries a copy of them, it does not take them away.
  const cleanupFlight = buildFlight(tl, plan, host, ms(OPEN), EASE_FLOW, 'open', { keepTrigger: true });

  // The pair's ids stay put: the close needs them to find its way home. Nothing
  // is written to the trigger, so nothing has to be cleared off it either.
  return settle(tl, () => {
    cleanupFlight();
    clearTransition(el);
  });
}

export function closeAnchoredSurface(parts: AnchoredParts, config: AnchoredConfig = {}): Promise<void> {
  ensure();
  const { trigger, surface: el, content, host } = parts;
  const ms = (value: number) => (value / 1000) * slowFactor(el);
  const origin = config.origin ?? box(trigger);

  const handover = (): void => {
    delete trigger.dataset['flipId'];
    delete el.dataset['flipId'];
  };

  const from = box(el);
  const toSurface = surface(trigger);

  if (prefersReducedMotion()) {
    const tl = gsap.timeline();
    tl.to(el, { opacity: 0, duration: ms(GENTLE), ease: 'power2.in' }, 0);
    return settle(tl, () => {
      clearTransition(el);
      handover();
    });
  }

  const plan = measureFlight(trigger, el, !!config.shareWords, 'close');
  anchorLayer(content);

  // The origin is the destination this time, so its box is what Flip records.
  const state = Flip.getState(trigger);
  const tl = Flip.to(state, {
    targets: el,
    scale: true,
    duration: ms(CLOSE),
    ease: EASE_FLOW_CLOSE,
    toggleClass: 'morph-closing',
  });

  driveShape(tl, el, {
    fromScale: { x: 1, y: 1 },
    toScale: { x: origin.width / from.width, y: origin.height / from.height },
    fromRadius: Number.parseFloat(surface(el).radius) || 0,
    toRadius: clampedRadius(Number.parseFloat(toSurface.radius) || 0, origin),
    geoDuration: ms(CLOSE),
    geoEase: EASE_FLOW_CLOSE,
    radiusDuration: ms(CLOSE),
    radiusEase: EASE_FLOW,
  });

  tl.to(
    el,
    { backgroundColor: toSurface.background, boxShadow: shadowOf(toSurface.shadow), duration: ms(CLOSE), ease: EASE_FLOW_CLOSE },
    0,
  );

  /*
   * By the last stretch the surface is the origin's own box wearing the origin's
   * own fill, with nothing left of it that the page underneath does not already
   * show - so it hands the box over instead of being switched off. Without this
   * the whole of the surface is revealed leaving in the single frame it stops
   * being drawn, which is a pop at the end of an otherwise continuous movement.
   */
  tl.to(el, { opacity: 0, duration: ms(HANDOVER), ease: EASE_OUT_SOFT }, ms(CLOSE - HANDOVER));

  // Same on the way back: the words are landing on a trigger that never stopped
  // showing them, which is a merge rather than a label switching itself off.
  const cleanupFlight = buildFlight(tl, plan, host, ms(CLOSE), EASE_FLOW_CLOSE, 'close', { keepTrigger: true });

  return settle(tl, () => {
    cleanupFlight();
    clearTransition(el);
    handover();
  });
}
