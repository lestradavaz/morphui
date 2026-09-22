import gsap from 'gsap';

import {
  EASE_BLUR,
  EASE_CSS,
  EASE_FLOW,
  EASE_FLOW_CLOSE,
  EASE_IN_OUT_SOFT,
  EASE_IN_STRONG,
  EASE_OUT_SOFT,
  EASE_SHAPE,
  flowAt,
  registerMorphEases,
} from './easing.js';
import { box, lerpBox, prefersReducedMotion, slowFactor, surface, type Box } from './measure.js';
import { measureWords, spawnWordClones, type WordRect } from './words.js';

export type MorphVariant = 'dialog' | 'window' | 'fullscreen';

export interface MorphParts {
  trigger: HTMLElement;
  dialog: HTMLDialogElement;
  panel: HTMLElement;
  content: HTMLElement;
  tint: HTMLElement;
}

export interface MorphConfig {
  variant: MorphVariant;
  wordsFrom?: HTMLElement | null;
  wordsTo?: HTMLElement | null;
}

/* Durations in milliseconds, as the reference components use them. */
const OPEN = 700;
const CLOSE = 500;
const SURFACE = 300;
const FULL_RADIUS = 1200;
const WINDOW_RADIUS = 1000;
const CONTENT_CLOSE = 2000;
const TRIGGER_HIDE = 160;
const TRIGGER_SHOW = 300;
const TRIGGER_SHOW_DELAY = 200;
const TINT = 500;
const TINT_WINDOW = 200;
const GENTLE = 150;

/** The content only gets flow(0.25) of the way home before the panel closes over it. */
const CONTENT_LAG = CLOSE / CONTENT_CLOSE;

const ms = (value: number) => (value / 1000) * slowFactor();

let ready = false;
function ensure(): void {
  if (ready) return;
  registerMorphEases();
  ready = true;
}

/** A GSAP timeline is thenable but resolves with itself; callers only want completion. */
async function settle(timeline: gsap.core.Timeline, done: () => void): Promise<void> {
  await timeline;
  done();
}

function clearAll(...elements: (Element | null | undefined)[]): void {
  for (const el of elements) if (el) gsap.set(el, { clearProps: 'all' });
}

/**
 * Pins the panel at a known box and freezes the content at that size.
 *
 * Afterwards the panel clips by animating its own width and height while the
 * content only ever scales, so the content never reflows mid-flight. This is what
 * the browser does for free inside a view transition, where the group clips a
 * snapshot that the new state scales into.
 */
function stage(panel: HTMLElement, content: HTMLElement, at: Box): void {
  gsap.set(panel, {
    position: 'fixed',
    margin: 0,
    left: at.x,
    top: at.y,
    width: at.width,
    height: at.height,
    overflow: 'hidden',
    transformOrigin: 'top left',
  });
  gsap.set(content, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: at.width,
    height: at.height,
    transformOrigin: 'top left',
  });
}

/**
 * Word stand-ins.
 *
 * Both sets of rectangles must be measured while their elements are at their
 * natural size. Measuring the destination after the panel has been staged reads
 * the heading while it is squeezed to the trigger's box, and every word then
 * flies to the wrong place.
 */
function wordFlight(
  timeline: gsap.core.Timeline,
  fromWords: WordRect[],
  toWords: WordRect[],
  reveal: HTMLElement | null | undefined,
  duration: number,
  ease: string,
): (() => void) | null {
  if (fromWords.length === 0 || toWords.length === 0 || !reveal) return null;

  const { layer, clones, targets, scales } = spawnWordClones(fromWords, toWords);
  if (clones.length === 0) return null;
  document.body.append(layer);
  gsap.set(reveal, { opacity: 0 });

  clones.forEach((clone, i) => {
    const target = targets[i]!;
    const start = fromWords[i]!.box;
    timeline.fromTo(
      clone,
      { x: 0, y: 0, scale: scales[i]! },
      { x: target.x - start.x, y: target.y - start.y, scale: 1, duration, ease },
      0,
    );
  });

  return () => {
    layer.remove();
    gsap.set(reveal, { clearProps: 'opacity' });
  };
}

export function openMorph(parts: MorphParts, config: MorphConfig): Promise<void> {
  ensure();
  const { trigger, dialog, panel, content, tint } = parts;
  const gentle = prefersReducedMotion();
  const isWindow = config.variant === 'window';

  const from = box(trigger);
  const fromSurface = surface(trigger);
  const fromWords = !gentle && config.wordsFrom ? measureWords(config.wordsFrom) : [];

  dialog.showModal();

  const to = box(panel);
  const toSurface = surface(panel);
  // Measured before stage() squeezes the panel, or the targets are meaningless.
  const toWords = !gentle && config.wordsTo ? measureWords(config.wordsTo) : [];

  if (gentle) {
    const tl = gsap.timeline();
    tl.from(tint, { opacity: 0, duration: ms(GENTLE), ease: EASE_CSS }, 0);
    tl.from(panel, { opacity: 0, duration: ms(GENTLE), ease: EASE_CSS }, 0);
    return settle(tl, () => clearAll(panel, tint));
  }

  stage(panel, content, to);

  /*
   * The FLIP delta. stage() already pinned the panel at its final box, so the
   * delta between the two measured rectangles is a subtraction.
   */
  const tl = gsap.timeline();

  tl.from(
    panel,
    {
      x: from.x - to.x,
      y: from.y - to.y,
      width: from.width,
      height: from.height,
      duration: ms(OPEN),
      ease: EASE_FLOW,
    },
    0,
  );

  tl.from(
    content,
    { scaleX: from.width / to.width, scaleY: from.height / to.height, duration: ms(OPEN), ease: EASE_FLOW },
    0,
  );

  if (isWindow) {
    // The window borrows nothing from the trigger. It arrives out of focus and
    // sharpens, and its corners round in over a much longer beat.
    tl.from(content, { filter: 'blur(32px)', duration: ms(SURFACE), ease: EASE_BLUR }, 0);
    tl.from(panel, { borderRadius: '64px', duration: ms(WINDOW_RADIUS), ease: EASE_SHAPE }, 0);
    tl.from(tint, { opacity: 0, duration: ms(TINT_WINDOW), ease: EASE_CSS }, 0);
  } else {
    /*
     * The panel's content resolves out of the trigger rather than being pasted
     * on top of it: it runs the full opening beat from transparent and blurred.
     *
     * Leaving this out is what makes the transition read as a squashed panel
     * growing instead of a button becoming a panel - the geometry is identical
     * either way, so it looks like a motion bug when it is really a missing
     * cross-fade.
     */
    tl.from(
      content,
      { opacity: 0, filter: 'blur(8px)', duration: ms(OPEN), ease: EASE_FLOW },
      0,
    );

    // The container starts wearing the trigger's fill, radius and shadow.
    tl.from(
      panel,
      {
        backgroundColor: fromSurface.background,
        boxShadow: fromSurface.shadow,
        duration: ms(SURFACE),
        ease: EASE_FLOW,
      },
      0,
    );

    const fullScreen = Number.parseFloat(toSurface.radius) === 0;
    tl.from(
      panel,
      {
        borderRadius: fromSurface.radius,
        duration: ms(fullScreen ? FULL_RADIUS : SURFACE),
        ease: fullScreen ? EASE_IN_OUT_SOFT : EASE_FLOW,
      },
      0,
    );

    tl.to(trigger, { opacity: 0, duration: ms(TRIGGER_HIDE), ease: EASE_CSS }, 0);
    tl.from(tint, { opacity: 0, duration: ms(TINT), ease: EASE_FLOW }, 0);
  }

  const cleanupWords = wordFlight(tl, fromWords, toWords, config.wordsTo, ms(OPEN), EASE_FLOW);

  return settle(tl, () => {
    cleanupWords?.();
    clearAll(panel, content, tint);
  });
}

export function closeMorph(parts: MorphParts, config: MorphConfig): Promise<void> {
  ensure();
  const { trigger, dialog, panel, content, tint } = parts;
  const gentle = prefersReducedMotion();
  const isWindow = config.variant === 'window';

  const finish = (): void => {
    dialog.close();
    clearAll(panel, content, tint, trigger);
  };

  if (gentle) {
    const tl = gsap.timeline();
    tl.to(panel, { opacity: 0, duration: ms(GENTLE), ease: EASE_CSS }, 0);
    tl.to(tint, { opacity: 0, duration: ms(GENTLE), ease: EASE_CSS }, 0);
    return settle(tl, finish);
  }

  const from = box(panel);
  const fromSurface = surface(panel);
  const to = box(trigger);
  const toSurface = surface(trigger);
  const fromWords = config.wordsTo ? measureWords(config.wordsTo) : [];
  const toWords = config.wordsFrom ? measureWords(config.wordsFrom) : [];

  stage(panel, content, from);

  const tl = gsap.timeline();

  if (isWindow) {
    tl.to(
      panel,
      {
        x: to.x + to.width / 2 - (from.x + from.width / 2),
        y: to.y + to.height / 2 - (from.y + from.height / 2),
        scale: Math.max(to.width / from.width, to.height / from.height),
        transformOrigin: 'center center',
        duration: ms(CLOSE),
        ease: EASE_FLOW_CLOSE,
      },
      0,
    );
    tl.to(panel, { borderRadius: '400px', duration: ms(CLOSE), ease: EASE_SHAPE }, 0);
    tl.to(content, { filter: 'blur(32px)', duration: ms(CLOSE), ease: EASE_BLUR }, 0);
    tl.to(panel, { opacity: 0, duration: ms(CLOSE), ease: EASE_SHAPE }, 0);
    tl.to(tint, { opacity: 0, duration: ms(CLOSE), ease: EASE_CSS }, 0);

    const cleanupWindowWords = wordFlight(tl, fromWords, toWords, config.wordsFrom, ms(CLOSE), EASE_FLOW_CLOSE);
    return settle(tl, () => {
      cleanupWindowWords?.();
      finish();
    });
  }

  /*
   * Container and content come off one clock so they cannot drift.
   *
   * The container follows the flow curve all the way home. The content follows
   * the same curve but only reaches flow(0.25) of the way, so it trails and the
   * closing container clips it. Two tweens with different eases would look close
   * and would not stay in lockstep, and the clipping is exactly where drift shows.
   */
  const driver = { t: 0 };
  const flow = gsap.parseEase(EASE_FLOW);

  tl.to(
    driver,
    {
      t: 1,
      duration: ms(CLOSE),
      ease: 'none',
      onUpdate: () => {
        const container = lerpBox(from, to, flow(driver.t));
        const trailing = lerpBox(from, to, flow(driver.t * CONTENT_LAG));
        gsap.set(panel, {
          x: container.x - from.x,
          y: container.y - from.y,
          width: container.width,
          height: container.height,
        });
        gsap.set(content, {
          x: trailing.x - container.x,
          y: trailing.y - container.y,
          scaleX: trailing.width / from.width,
          scaleY: trailing.height / from.height,
        });
      },
    },
    0,
  );

  // The content rounds, defocuses and fades while it trails, so what the closing
  // container clips is already dissolving rather than a crisp rectangle.
  tl.to(content, { borderRadius: '400px', duration: ms(CLOSE), ease: EASE_SHAPE }, 0);
  tl.to(content, { filter: 'blur(32px)', duration: ms(CLOSE), ease: EASE_BLUR }, 0);
  tl.to(content, { opacity: 0, duration: ms(CLOSE), ease: EASE_SHAPE }, 0);

  tl.to(
    panel,
    {
      backgroundColor: toSurface.background,
      borderRadius: toSurface.radius,
      boxShadow: toSurface.shadow,
      duration: ms(CLOSE),
      ease: EASE_FLOW,
    },
    0,
  );

  tl.to(tint, { opacity: 0, duration: ms(CLOSE), ease: EASE_IN_STRONG }, 0);

  // The trigger returns underneath the shrinking panel, not with it.
  tl.fromTo(
    trigger,
    { opacity: 0 },
    { opacity: 1, duration: ms(TRIGGER_SHOW), ease: EASE_OUT_SOFT },
    ms(TRIGGER_SHOW_DELAY),
  );

  const cleanupWords = wordFlight(tl, fromWords, toWords, config.wordsFrom, ms(CLOSE), EASE_FLOW);

  return settle(tl, () => {
    cleanupWords?.();
    finish();
  });
}

export const MORPH_TIMING = {
  open: OPEN,
  close: CLOSE,
  surface: SURFACE,
  contentLag: CONTENT_LAG,
  contentReach: () => flowAt(CONTENT_LAG),
} as const;
