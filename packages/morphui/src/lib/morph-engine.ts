import gsap from 'gsap';

import {
  EASE_FLOW,
  EASE_FLOW_CLOSE,
  EASE_IN_OUT_SOFT,
  EASE_OUT_SOFT,
  laggedDistance,
  registerMorphEases,
} from './easing.js';
import { box, lerpBox, prefersReducedMotion, slowFactor, surface, type Box } from './measure.js';
import { measureWords, spawnWordClones } from './words.js';

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
  /** Element whose words fly into the panel. Null disables the word flight. */
  wordsFrom?: HTMLElement | null;
  /** Its counterpart inside the panel. */
  wordsTo?: HTMLElement | null;
}

/* Durations, in milliseconds, exactly as the reference components use them. */
const OPEN = 700;
const CLOSE = 500;
const SURFACE = 300;
const FULL_RADIUS = 1200;
const CONTENT_CLOSE = 2000;
const TRIGGER_HIDE = 160;
const TRIGGER_SHOW = 300;
const TRIGGER_SHOW_DELAY = 200;
const TINT = 500;
const TINT_WINDOW = 200;
const GENTLE = 150;

/** The content only gets `flow(0.25)` of the way home before the panel closes over it. */
const CONTENT_LAG = CLOSE / CONTENT_CLOSE;

let pluginsReady = false;
function ensurePlugins(): void {
  if (pluginsReady) return;
  registerMorphEases();
  pluginsReady = true;
}

const ms = (value: number) => (value / 1000) * slowFactor();

/** A GSAP timeline is thenable but resolves with itself; callers only want completion. */
async function settle(timeline: gsap.core.Timeline, done: () => void): Promise<void> {
  await timeline;
  done();
}

function clearAll(...elements: (Element | null | undefined)[]): void {
  for (const el of elements) if (el) gsap.set(el, { clearProps: 'all' });
}

/**
 * Parks the panel at its final geometry with `position: fixed`, and freezes the
 * content at the panel's final size.
 *
 * Everything after this animates against numbers that cannot move: the panel
 * clips by animating its own width and height, and the content never reflows
 * because its box is already final. This is what the browser does for free
 * inside a view transition, where the group clips a snapshot that only scales.
 */
function stage(panel: HTMLElement, content: HTMLElement, to: Box): void {
  gsap.set(panel, {
    position: 'fixed',
    margin: 0,
    left: to.x,
    top: to.y,
    width: to.width,
    height: to.height,
    overflow: 'hidden',
    transformOrigin: 'top left',
  });
  gsap.set(content, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: to.width,
    height: to.height,
    transformOrigin: 'top left',
  });
}

function wordFlight(
  timeline: gsap.core.Timeline,
  from: HTMLElement | null | undefined,
  to: HTMLElement | null | undefined,
  duration: number,
  ease: string,
): (() => void) | null {
  if (!from || !to) return null;
  const fromWords = measureWords(from);
  const toWords = measureWords(to);
  if (fromWords.length === 0 || toWords.length === 0) return null;

  const { layer, clones, targets, scales } = spawnWordClones(fromWords, toWords);
  if (clones.length === 0) return null;
  document.body.append(layer);

  // The real text stays hidden while its stand-ins are in the air.
  gsap.set(to, { opacity: 0 });

  clones.forEach((clone, i) => {
    const target = targets[i]!;
    const start = fromWords[i]!.box;
    timeline.fromTo(
      clone,
      { x: 0, y: 0, scale: scales[i]! },
      {
        x: target.x - start.x,
        y: target.y - start.y,
        scale: 1,
        duration,
        ease,
      },
      0,
    );
  });

  return () => {
    layer.remove();
    gsap.set(to, { clearProps: 'opacity' });
  };
}

export function openMorph(parts: MorphParts, config: MorphConfig): Promise<void> {
  ensurePlugins();
  const { trigger, dialog, panel, content, tint } = parts;
  const gentle = prefersReducedMotion();

  const from = box(trigger);
  const fromSurface = surface(trigger);

  dialog.showModal();

  const to = box(panel);
  const toSurface = surface(panel);

  if (gentle) {
    const tl = gsap.timeline();
    tl.from(tint, { opacity: 0, duration: ms(GENTLE), ease: 'power2.out' }, 0);
    tl.from(panel, { opacity: 0, duration: ms(GENTLE), ease: 'power2.out' }, 0);
    return settle(tl, () => clearAll(panel, tint));
  }

  stage(panel, content, to);

  /*
   * The FLIP delta: first and last are measured, the panel is inverted onto the
   * trigger, then played back.
   *
   * Flip.fit() is the plugin's tool for this and it is redundant here. stage()
   * has already pinned the panel with position/left/top at its final box, so the
   * delta between the two measured rectangles is a subtraction, and doing it
   * directly keeps one source of truth for the geometry. The plugin still earns
   * its place elsewhere in the library; this one spot does not need it.
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
    {
      scaleX: from.width / to.width,
      scaleY: from.height / to.height,
      duration: ms(OPEN),
      ease: EASE_FLOW,
    },
    0,
  );

  if (config.variant === 'window') {
    // The window never borrows the trigger's surface; it rounds and sharpens.
    tl.from(panel, { borderRadius: '64px', duration: ms(1000), ease: 'power2.inOut' }, 0);
    tl.from(content, { filter: 'blur(8px)', opacity: 0, duration: ms(SURFACE), ease: 'power2.out' }, 0);
    tl.from(tint, { opacity: 0, duration: ms(TINT_WINDOW), ease: 'none' }, 0);
  } else {
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

    // A full-screen panel has no radius to land on, so the corners take much
    // longer to open out. A panel with corners matches the surface timing.
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

    tl.to(trigger, { opacity: 0, duration: ms(TRIGGER_HIDE), ease: 'none' }, 0);
    tl.from(tint, { opacity: 0, duration: ms(TINT), ease: EASE_FLOW }, 0);
  }

  const cleanupWords = wordFlight(tl, config.wordsFrom, config.wordsTo, ms(OPEN), EASE_FLOW);

  return settle(tl, () => {
    cleanupWords?.();
    clearAll(panel, content, tint);
  });
}

export function closeMorph(parts: MorphParts, config: MorphConfig): Promise<void> {
  ensurePlugins();
  const { trigger, dialog, panel, content, tint } = parts;
  const gentle = prefersReducedMotion();

  const finish = (): void => {
    dialog.close();
    clearAll(panel, content, tint, trigger);
  };

  if (gentle) {
    const tl = gsap.timeline();
    tl.to(panel, { opacity: 0, duration: ms(GENTLE), ease: 'power2.in' }, 0);
    tl.to(tint, { opacity: 0, duration: ms(GENTLE), ease: 'power2.in' }, 0);
    return settle(tl, finish);
  }

  const from = box(panel);
  const fromSurface = surface(panel);
  const to = box(trigger);
  const toSurface = surface(trigger);

  stage(panel, content, from);

  const tl = gsap.timeline();

  if (config.variant === 'window') {
    tl.to(panel, {
      x: to.x + to.width / 2 - (from.x + from.width / 2),
      y: to.y + to.height / 2 - (from.y + from.height / 2),
      scale: Math.max(to.width / from.width, to.height / from.height),
      borderRadius: '64px',
      filter: 'blur(8px)',
      opacity: 0,
      transformOrigin: 'center center',
      duration: ms(CLOSE),
      ease: EASE_FLOW_CLOSE,
    }, 0);
    tl.to(tint, { opacity: 0, duration: ms(CLOSE), ease: 'power3.in' }, 0);
    const cleanupWords = wordFlight(tl, config.wordsTo, config.wordsFrom, ms(CLOSE), EASE_FLOW_CLOSE);
    return settle(tl, () => {
      cleanupWords?.();
      finish();
    });
  }

  /*
   * The container and the content are driven from one clock so they cannot drift.
   *
   * The container follows the flow curve all the way home. The content follows
   * the same curve but only reaches `flow(0.25)` of the way, so it trails behind
   * and the closing container clips it. Two separate tweens with different eases
   * would look close but would not stay in lockstep, and the clipping is exactly
   * where drift would show.
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

  tl.to(tint, { opacity: 0, duration: ms(CLOSE), ease: 'power3.in' }, 0);

  // The trigger comes back under the shrinking panel, not with it.
  tl.fromTo(
    trigger,
    { opacity: 0 },
    { opacity: 1, duration: ms(TRIGGER_SHOW), ease: EASE_OUT_SOFT },
    ms(TRIGGER_SHOW_DELAY),
  );

  const cleanupWords = wordFlight(tl, config.wordsTo, config.wordsFrom, ms(CLOSE), EASE_FLOW);

  return settle(tl, () => {
    cleanupWords?.();
    finish();
  });
}

/** Exposed so a consumer can reason about the timings without reading the source. */
export const MORPH_TIMING = {
  open: OPEN,
  close: CLOSE,
  surface: SURFACE,
  contentLag: CONTENT_LAG,
  contentReach: () => laggedDistance(CONTENT_LAG),
} as const;
