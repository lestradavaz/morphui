import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

import {
  EASE_FLOW,
  EASE_FLOW_CLOSE,
  EASE_IN_OUT_SOFT,
  EASE_IN_STRONG,
  EASE_OUT_SOFT,
  EASE_SHAPE,
  registerMorphEases,
} from './easing.js';
import { box, prefersReducedMotion, slowFactor, surface, type Box } from './measure.js';
import { buildWordClones, collectItems, measureWordInk, type ItemPair } from './shared.js';

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
  /** Fly the trigger's words into the element marked `data-morph-words` in the panel. */
  shareWords?: boolean;
}

const OPEN = 700;
const CLOSE = 500;
const SURFACE = 300;
const FULL_RADIUS = 1200;
const WINDOW_RADIUS = 1000;
const WINDOW_START_RADIUS = 64;
const TRIGGER_HIDE = 160;
const TRIGGER_SHOW = 300;
const TRIGGER_SHOW_DELAY = 200;
const TINT = 500;
const TINT_WINDOW = 200;
const GENTLE = 150;

const ms = (value: number) => (value / 1000) * slowFactor();
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

let ready = false;
let uid = 0;

function ensure(): void {
  if (ready) return;
  gsap.registerPlugin(Flip);
  registerMorphEases();
  ready = true;
}

async function settle(timeline: gsap.core.Timeline, done: () => void): Promise<void> {
  await timeline;
  done();
}

function clearAll(...elements: (Element | null | undefined)[]): void {
  for (const el of elements) if (el) gsap.set(el, { clearProps: 'all' });
}

/**
 * The double layer.
 *
 * The panel moves on transforms alone - translate and scale, nothing the
 * compositor has to lay out again. That is the whole reason the reference feels
 * smoother: a view transition animates the width and height of a *snapshot*, so
 * no layout runs, while animating width and height on real DOM reflows the panel
 * and its subtree on every frame.
 *
 * Scaling alone would stretch the content and turn the corners into ellipses, so
 * a second layer undoes it. The content counter-scales by exactly the inverse,
 * and the radius is divided per axis, which is what `border-radius: Rx / Ry`
 * means. The box grows, the shape never distorts, and nothing leaves the GPU.
 */
interface ShapeOptions {
  fromScale: { x: number; y: number };
  toScale: { x: number; y: number };
  fromRadius: number;
  toRadius: number;
  geoDuration: number;
  geoEase: string;
  radiusDuration: number;
  radiusEase: string;
}

function driveShape(
  timeline: gsap.core.Timeline,
  panel: HTMLElement,
  content: HTMLElement,
  options: ShapeOptions,
): void {
  const { fromScale, toScale, fromRadius, toRadius, geoDuration, geoEase, radiusDuration, radiusEase } = options;

  /*
   * The corners run on their own clock.
   *
   * The reference gives the radius a separate beat from the box, and a much
   * longer one when the panel is going full screen: 1200ms against 700ms, on a
   * gentler curve, so the corners ease open instead of snapping square. A shared
   * driver keeps both readings off one elapsed time, which is the only way the
   * scale compensation stays exact - the radius has to be divided by whatever the
   * scale is at that instant, not at some other point on a second timeline.
   */
  const total = Math.max(geoDuration, radiusDuration);
  const geo = gsap.parseEase(geoEase);
  const rad = gsap.parseEase(radiusEase);
  const driver = { t: 0 };

  timeline.to(
    driver,
    {
      t: 1,
      duration: total,
      ease: 'none',
      onUpdate: () => {
        const elapsed = driver.t * total;
        const gp = geo(Math.min(1, elapsed / geoDuration));
        const rp = rad(Math.min(1, elapsed / radiusDuration));

        const sx = lerp(fromScale.x, toScale.x, gp) || 1;
        const sy = lerp(fromScale.y, toScale.y, gp) || 1;
        const r = lerp(fromRadius, toRadius, rp);

        gsap.set(content, { scaleX: 1 / sx, scaleY: 1 / sy });
        /*
         * Written straight to the element, not through gsap.set.
         *
         * `border-radius: 92px / 200px` is the two-axis shorthand - every corner
         * gets a 92px horizontal radius and a 200px vertical one, which is what
         * cancels a non-uniform scale. GSAP's parser does not take that form: it
         * wrote the first number to the top-left corner and left the other three
         * on their stylesheet value, so each corner ended up rounded differently.
         */
        panel.style.borderRadius = `${r / sx}px / ${r / sy}px`;
      },
    },
    0,
  );
}

/** Freezes the content at the panel's final box so it never reflows mid-flight. */
function freezeContent(content: HTMLElement, at: Box): void {
  gsap.set(content, {
    position: 'absolute',
    top: 0,
    left: 0,
    width: at.width,
    height: at.height,
    transformOrigin: 'top left',
  });
}

interface FlightPlan {
  items: ItemPair[];
  words: { sourceInk: Box[]; targetInk: Box[]; land: HTMLElement; heading: HTMLElement; origin: HTMLElement } | null;
}

/**
 * Reads every rectangle the flight needs, and must run before anything is
 * transformed.
 *
 * Flip applies its starting transform the moment the timeline is built, so a
 * measurement taken after that reads the heading while the panel is squeezed
 * down to the trigger's box - off by the better part of the viewport. Measuring
 * is therefore its own step, called while the panel is still at its natural size.
 */
function measureFlight(
  origin: HTMLElement,
  panel: HTMLElement,
  shareWords: boolean,
  phase: 'open' | 'close',
): FlightPlan {
  const items = collectItems(origin, panel);
  const heading = shareWords ? panel.querySelector<HTMLElement>('[data-morph-words]') : null;
  if (!heading) return { items, words: null };

  const opening = phase === 'open';
  const start = opening ? origin : heading;
  const land = opening ? heading : origin;

  return {
    items,
    words: {
      sourceInk: measureWordInk(start),
      targetInk: measureWordInk(land),
      land,
      heading,
      origin,
    },
  };
}

/** Turns the plan into tweens. Safe to call once the panel has been transformed. */
function buildFlight(
  timeline: gsap.core.Timeline,
  plan: FlightPlan,
  host: HTMLElement,
  duration: number,
  ease: string,
  phase: 'open' | 'close',
): () => void {
  const opening = phase === 'open';
  const undo: (() => void)[] = [];

  for (const { source, target, sourceBox, targetBox } of plan.items) {
    const vars: gsap.TweenVars = {
      x: sourceBox.x - targetBox.x,
      y: sourceBox.y - targetBox.y,
      scaleX: targetBox.width ? sourceBox.width / targetBox.width : 1,
      scaleY: targetBox.height ? sourceBox.height / targetBox.height : 1,
      transformOrigin: 'left top',
      duration,
      ease,
    };
    if (opening) timeline.from(target, vars, 0);
    else timeline.to(target, vars, 0);
    gsap.set(source, { visibility: 'hidden' });
  }
  if (plan.items.length) {
    undo.push(() => {
      for (const { source, target } of plan.items) {
        gsap.set(source, { clearProps: 'visibility' });
        gsap.set(target, { clearProps: 'transform' });
      }
    });
  }

  if (plan.words) {
    const { sourceInk, targetInk, land, heading, origin } = plan.words;
    const built = buildWordClones(sourceInk, targetInk, land, host);
    if (built) {
      for (const { clone, sourceBox, targetBox } of built.clones) {
        timeline.from(
          clone,
          {
            x: sourceBox.x - targetBox.x,
            y: sourceBox.y - targetBox.y,
            scale: targetBox.height ? sourceBox.height / targetBox.height : 1,
            duration,
            ease,
          },
          0,
        );
      }
      // Neither end shows its own text while the stand-ins are up. The heading
      // goes outright; the trigger only loses its ink, so its box can still fade
      // on its own schedule.
      gsap.set(heading, { opacity: 0 });
      gsap.set(origin, { color: 'transparent' });
      undo.push(() => {
        built.layer.remove();
        gsap.set(heading, { clearProps: 'opacity' });
        gsap.set(origin, { clearProps: 'color' });
      });
    }
  }

  return () => undo.forEach((fn) => fn());
}

export function openMorph(parts: MorphParts, config: MorphConfig): Promise<void> {
  ensure();
  const { trigger, dialog, panel, content, tint } = parts;
  const gentle = prefersReducedMotion();
  const isWindow = config.variant === 'window';

  if (gentle) {
    dialog.showModal();
    const tl = gsap.timeline();
    tl.from(tint, { opacity: 0, duration: ms(GENTLE), ease: 'power2.out' }, 0);
    tl.from(panel, { opacity: 0, duration: ms(GENTLE), ease: 'power2.out' }, 0);
    return settle(tl, () => clearAll(panel, tint));
  }

  // Flip pairs the two elements by id: the trigger's recorded box becomes the
  // panel's starting box.
  const id = `morph-${++uid}`;
  trigger.dataset['flipId'] = id;
  panel.dataset['flipId'] = id;

  const from = box(trigger);
  const fromSurface = surface(trigger);
  const state = Flip.getState(trigger);

  dialog.showModal();

  const to = box(panel);
  const toRadius = Number.parseFloat(surface(panel).radius) || 0;

  // Before anything is transformed.
  const plan = measureFlight(trigger, panel, !!config.shareWords, 'open');

  freezeContent(content, to);

  const tl = Flip.from(state, {
    targets: panel,
    scale: true,
    duration: ms(OPEN),
    ease: EASE_FLOW,
    toggleClass: isWindow ? 'morph-window-opening' : 'morph-opening',
  });

  /*
   * A panel with corners meets the trigger's radius on the surface beat. A
   * full-screen one has no radius to land on, so the corners take the long beat
   * and a gentler curve - otherwise the box arrives filling the viewport with its
   * corners still visibly squaring off.
   */
  const fullScreen = toRadius === 0;
  driveShape(tl, panel, content, {
    fromScale: { x: from.width / to.width, y: from.height / to.height },
    toScale: { x: 1, y: 1 },
    fromRadius: isWindow ? WINDOW_START_RADIUS : Number.parseFloat(fromSurface.radius) || 0,
    toRadius,
    geoDuration: ms(OPEN),
    geoEase: EASE_FLOW,
    radiusDuration: ms(isWindow ? WINDOW_RADIUS : fullScreen ? FULL_RADIUS : SURFACE),
    radiusEase: isWindow ? EASE_SHAPE : fullScreen ? EASE_IN_OUT_SOFT : EASE_FLOW,
  });

  if (!isWindow) {
    tl.from(panel, { backgroundColor: fromSurface.background, duration: ms(OPEN) / 2.33, ease: EASE_FLOW }, 0);
    tl.to(trigger, { opacity: 0, duration: ms(TRIGGER_HIDE), ease: 'none' }, 0);
  }

  tl.from(tint, { opacity: 0, duration: ms(isWindow ? TINT_WINDOW : TINT), ease: EASE_FLOW }, 0);

  const cleanupFlight = buildFlight(tl, plan, dialog, ms(OPEN), EASE_FLOW, 'open');

  return settle(tl, () => {
    cleanupFlight();
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
    delete trigger.dataset['flipId'];
    delete panel.dataset['flipId'];
  };

  if (gentle) {
    const tl = gsap.timeline();
    tl.to(panel, { opacity: 0, duration: ms(GENTLE), ease: 'power2.in' }, 0);
    tl.to(tint, { opacity: 0, duration: ms(GENTLE), ease: 'power2.in' }, 0);
    return settle(tl, finish);
  }

  const from = box(panel);
  const to = box(trigger);
  const toSurface = surface(trigger);
  const fromRadius = Number.parseFloat(surface(panel).radius) || 0;

  const plan = measureFlight(trigger, panel, !!config.shareWords, 'close');

  freezeContent(content, from);

  // The trigger is the destination this time, so its box is what Flip records.
  const state = Flip.getState(trigger);
  const ease = isWindow ? EASE_FLOW_CLOSE : EASE_FLOW;

  const tl = Flip.to(state, {
    targets: panel,
    scale: true,
    duration: ms(CLOSE),
    ease,
    toggleClass: 'morph-closing',
  });

  driveShape(tl, panel, content, {
    fromScale: { x: 1, y: 1 },
    toScale: { x: to.width / from.width, y: to.height / from.height },
    fromRadius,
    toRadius: isWindow ? WINDOW_START_RADIUS : Number.parseFloat(toSurface.radius) || 0,
    geoDuration: ms(CLOSE),
    geoEase: ease,
    radiusDuration: ms(CLOSE),
    radiusEase: isWindow ? EASE_SHAPE : EASE_FLOW,
  });

  tl.to(panel, { backgroundColor: toSurface.background, duration: ms(CLOSE), ease }, 0);
  tl.to(tint, { opacity: 0, duration: ms(CLOSE), ease: EASE_IN_STRONG }, 0);

  if (!isWindow) {
    // The trigger comes back underneath the shrinking panel, not with it.
    tl.fromTo(
      trigger,
      { opacity: 0 },
      { opacity: 1, duration: ms(TRIGGER_SHOW), ease: EASE_OUT_SOFT },
      ms(TRIGGER_SHOW_DELAY),
    );
  }

  const cleanupFlight = buildFlight(tl, plan, dialog, ms(CLOSE), ease, 'close');

  return settle(tl, () => {
    cleanupFlight();
    finish();
  });
}

export const MORPH_TIMING = { open: OPEN, close: CLOSE } as const;
