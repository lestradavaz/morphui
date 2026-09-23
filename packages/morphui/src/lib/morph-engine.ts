import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

import {
  EASE_FLOW,
  EASE_CSS,
  EASE_FLOW_CLOSE,
  EASE_IN_OUT_SOFT,
  EASE_IN_STRONG,
  EASE_OUT_SOFT,
  EASE_SHAPE,
  registerMorphEases,
} from './easing.js';
import { box, lerpBox, prefersReducedMotion, slowFactor, surface, type Box } from './measure.js';
import { buildItemFlight, buildWordClones, collectItems, measureWordInk, type ItemPair } from './shared.js';

export type MorphVariant = 'dialog' | 'window' | 'fullscreen';

export interface MorphParts {
  trigger: HTMLElement;
  dialog: HTMLDialogElement;
  panel: HTMLElement;
  content: HTMLElement;
  tint: HTMLElement;
  /** The layer holding the panel's chrome, when the panel was given any. */
  chrome?: HTMLElement | null;
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
const CONTENT_CLOSE = 2000;

/** The content only gets flow(0.25) of the way home before the panel closes over it. */
const CONTENT_LAG = CLOSE / CONTENT_CLOSE;

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
 * Transform the panel and compensate its corner radius per axis. Content follows
 * the panel on entry; on exit it trails behind the clipping surface. Shared
 * words and images travel separately in the dialog's top layer.
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
  /** Closing only: makes the content trail the container that is clipping it. */
  lag?: { content: HTMLElement; from: Box; to: Box; fraction: number };
  /** A layer outside the panel, kept over whatever box the panel is showing. */
  chrome?: { el: HTMLElement; from: Box; to: Box; need: Box };
}

function driveShape(timeline: gsap.core.Timeline, panel: HTMLElement, options: ShapeOptions): void {
  const {
    fromScale, toScale, fromRadius, toRadius,
    geoDuration, geoEase, radiusDuration, radiusEase,
    lag, chrome,
  } = options;

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

  /*
   * The chrome is put where it belongs before the timeline runs. The stylesheet
   * leaves it on the panel's resting box, which is the wrong box the moment a
   * transition starts, and the timeline does not necessarily render a frame
   * before the browser paints one.
   */
  const placeChrome = (progress: number): void => {
    if (!chrome) return;
    const visible = lerpBox(chrome.from, chrome.to, progress);
    /*
     * On when the panel has room for it, and not on a clock: on a clock a card's
     * button - whose trigger is already bigger than the button needs - waits for
     * a fade it never needed, while a dialog growing out of a pill puts a
     * full-size button on top of the label. What decides it is whether the box
     * on screen can hold the chrome yet, so that is what is asked, every frame.
     * It reverses on the way out for free.
     *
     * The band from just-fits to half again as much is the fade. Below it the
     * chrome crowds the trigger it grew from; above it there is room to spare.
     */
    const room = Math.min(visible.width / chrome.need.width, visible.height / chrome.need.height);
    frameChrome(chrome.el, visible, Math.max(0, Math.min(1, (room - 1) / 0.5)));
  };

  placeChrome(0);

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

        placeChrome(gp);

        if (lag) {
          /*
           * The content trails the container closing over it.
           *
           * The reference gives the container 500ms and the content 2000ms, then
           * plays only the first 500ms of the content's path, so the content
           * lands about 83% of the way home and the shrinking panel clips what is
           * left. That lag is the whole character of the close.
           *
           * The content sits inside the panel, so it already carries the panel's
           * transform. What it needs is the remainder: the trailing box expressed
           * relative to the container, which is the container's transform undone
           * and the trailing one applied. Hence the division by the panel's own
           * scale rather than a second set of absolute numbers.
           */
          const raw = Math.min(1, elapsed / geoDuration);
          const container = lerpBox(lag.from, lag.to, gp);
          const trailing = lerpBox(lag.from, lag.to, geo(raw * lag.fraction));
          gsap.set(lag.content, {
            x: (trailing.x - container.x) / sx,
            y: (trailing.y - container.y) / sy,
            scaleX: lag.from.width ? trailing.width / lag.from.width / sx : 1,
            scaleY: lag.from.height ? trailing.height / lag.from.height / sy : 1,
          });
        }

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

/**
 * Puts the chrome layer over a box, in viewport coordinates.
 *
 * Exported because the resting box is nobody else's business to guess: the panel
 * is sized by whatever the page put on it, so the only reliable answer is to
 * measure the panel and hand the numbers over - on settling, on a resize, and
 * on the paths that play no transition at all.
 */
export function frameChrome(el: HTMLElement, at: Box, opacity = 1): void {
  gsap.set(el, { left: at.x, top: at.y, width: at.width, height: at.height, opacity });
}

/**
 * The smallest panel that still holds the chrome, in the panel's own pixels.
 *
 * Like every other measurement here it has to be taken before Flip builds its
 * timeline, since that applies the starting transform at once and the chrome
 * would be read while the panel is squeezed down to the trigger.
 *
 * Each piece is read against whichever edge it sits nearer, because that is the
 * one it is anchored to: a button 24px from the right of an 800px panel is 744px
 * from the left, and reading it from the left would call for a panel it never
 * needs. Taking the nearer inset plus the piece's own size gives the box below
 * which it would start crowding the corner it is in.
 */
function chromeNeed(chrome: HTMLElement, panel: Box): Box {
  let width = 0;
  let height = 0;
  for (const child of Array.from(chrome.children)) {
    const r = child.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    width = Math.max(width, Math.min(r.left - panel.x, panel.x + panel.width - r.right) + r.width);
    height = Math.max(height, Math.min(r.top - panel.y, panel.y + panel.height - r.bottom) + r.height);
  }
  // Nothing measurable in there: nothing to wait for either.
  return { x: 0, y: 0, width: Math.max(1, width), height: Math.max(1, height) };
}

/*
 * The panel's layout box never changes any more - only its transform does - so
 * the layers inside it cannot reflow and do not need pinning. They only need the
 * same origin as the panel, so everything scales about the same corner.
 */
function anchorLayer(layer: HTMLElement | null | undefined): void {
  if (layer) gsap.set(layer, { transformOrigin: 'top left' });
}

interface FlightPlan {
  items: ItemPair[];
  words: {
    sourceInk: Box[];
    targetInk: Box[];
    source: HTMLElement;
    land: HTMLElement;
    heading: HTMLElement;
    origin: HTMLElement;
  } | null;
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
  const label = origin.querySelector<HTMLElement>('[data-morph-words]') ?? origin;
  const start = opening ? label : heading;
  const land = opening ? heading : label;

  return {
    items,
    words: {
      sourceInk: measureWordInk(start),
      targetInk: measureWordInk(land),
      source: start,
      land,
      heading,
      origin: label,
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

  for (const item of plan.items) {
    const flight = buildItemFlight(item, host, opening);
    const { from, to, outgoing, incoming } = flight;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    timeline.to(outgoing, {
      x: dx, y: dy, scaleX: to.width / from.width, scaleY: to.height / from.height,
      opacity: 0, duration, ease,
    }, 0);
    timeline.fromTo(incoming, {
      x: -dx, y: -dy, scaleX: from.width / to.width, scaleY: from.height / to.height,
      opacity: 0,
    }, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration, ease }, 0);
    const progress = { value: 0 };
    const renderRadius = () => flight.setProgress(progress.value);
    timeline.to(progress, { value: 1, duration, ease, onUpdate: renderRadius }, 0);
    renderRadius();
    undo.push(flight.cleanup);
  }

  if (plan.words) {
    const { sourceInk, targetInk, source, land, heading, origin } = plan.words;
    const built = buildWordClones(sourceInk, targetInk, source, land, host);
    if (built) {
      for (const pair of built.pairs) {
        const { sourceBox, targetBox } = pair;
        const growX = targetBox.width ? sourceBox.width / targetBox.width : 1;
        const growY = targetBox.height ? sourceBox.height / targetBox.height : 1;

        // Both ride the same box. The outgoing one starts at its natural size and
        // is carried up to the destination's; the incoming one starts shrunk to
        // the origin's and resolves to its own.
        timeline.to(
          pair.out,
          {
            x: targetBox.x - sourceBox.x,
            y: targetBox.y - sourceBox.y,
            scaleX: growX ? 1 / growX : 1,
            scaleY: growY ? 1 / growY : 1,
            opacity: 0,
            duration,
            ease,
          },
          0,
        );
        timeline.from(
          pair.in,
          {
            x: sourceBox.x - targetBox.x,
            y: sourceBox.y - targetBox.y,
            scaleX: growX,
            scaleY: growY,
            opacity: 0,
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
  const { trigger, dialog, panel, content, tint, chrome } = parts;
  const ms = (value: number) => (value / 1000) * slowFactor(panel);
  const gentle = prefersReducedMotion();
  const isWindow = config.variant === 'window';

  if (gentle) {
    dialog.showModal();
    if (chrome) frameChrome(chrome, box(panel));
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
  // Framed before it is read: the layer carries no box of its own, so until it
  // is put over the panel its contents are nowhere in particular.
  if (chrome) frameChrome(chrome, to);
  const need = chrome ? chromeNeed(chrome, to) : null;
  const sharesContent = !!plan.words || plan.items.length > 0;
  const borrowsSurface = !isWindow || sharesContent;

  anchorLayer(content);

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
  driveShape(tl, panel, {
    fromScale: { x: from.width / to.width, y: from.height / to.height },
    toScale: { x: 1, y: 1 },
    fromRadius: borrowsSurface ? Number.parseFloat(fromSurface.radius) || 0 : WINDOW_START_RADIUS,
    toRadius,
    geoDuration: ms(OPEN),
    geoEase: EASE_FLOW,
    radiusDuration: ms(isWindow ? WINDOW_RADIUS : fullScreen ? FULL_RADIUS : SURFACE),
    radiusEase: isWindow ? EASE_SHAPE : fullScreen ? EASE_IN_OUT_SOFT : EASE_FLOW,
    ...(chrome && need ? { chrome: { el: chrome, from, to, need } } : {}),
  });

  if (borrowsSurface) {
    /*
     * The panel wears the trigger's fill AND its shadow for the first beat. The
     * shadow was missing, which is why the panel arrived already sitting on its
     * own elevation instead of growing into it.
     *
     * A trigger with no shadow reports `none`, which cannot be interpolated, so
     * it becomes a transparent shadow of zero size - the same thing, in a form
     * that can be tweened.
     */
    const fromShadow = fromSurface.shadow === 'none' ? 'rgba(0, 0, 0, 0) 0px 0px 0px 0px' : fromSurface.shadow;
    tl.from(
      panel,
      { backgroundColor: fromSurface.background, boxShadow: fromShadow, duration: ms(SURFACE), ease: EASE_FLOW },
      0,
    );
    tl.to(trigger, { opacity: 0, duration: ms(TRIGGER_HIDE), ease: EASE_CSS }, 0);
  }

  tl.from(tint, { opacity: 0, duration: ms(isWindow ? TINT_WINDOW : TINT), ease: EASE_FLOW }, 0);

  const cleanupFlight = buildFlight(tl, plan, dialog, ms(OPEN), EASE_FLOW, 'open');

  return settle(tl, () => {
    cleanupFlight();
    clearAll(panel, content, tint, chrome);
    // clearAll takes the box with it, and the panel is back on its own.
    if (chrome) frameChrome(chrome, box(panel));
  });
}

export function closeMorph(parts: MorphParts, config: MorphConfig): Promise<void> {
  ensure();
  const { trigger, dialog, panel, content, tint, chrome } = parts;
  const ms = (value: number) => (value / 1000) * slowFactor(panel);
  const gentle = prefersReducedMotion();
  const isWindow = config.variant === 'window';

  const finish = (): void => {
    dialog.close();
    clearAll(panel, content, tint, trigger, chrome);
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
  if (chrome) frameChrome(chrome, from);
  const need = chrome ? chromeNeed(chrome, from) : null;
  const borrowsSurface = !isWindow || !!plan.words || plan.items.length > 0;

  anchorLayer(content);

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

  driveShape(tl, panel, {
    fromScale: { x: 1, y: 1 },
    toScale: { x: to.width / from.width, y: to.height / from.height },
    fromRadius,
    toRadius: borrowsSurface ? Number.parseFloat(toSurface.radius) || 0 : WINDOW_START_RADIUS,
    geoDuration: ms(CLOSE),
    geoEase: ease,
    radiusDuration: ms(CLOSE),
    radiusEase: isWindow ? EASE_SHAPE : EASE_FLOW,
    ...(isWindow ? {} : { lag: { content, from, to, fraction: CONTENT_LAG } }),
    ...(chrome && need ? { chrome: { el: chrome, from, to, need } } : {}),
  });

  const toShadow = toSurface.shadow === 'none' ? 'rgba(0, 0, 0, 0) 0px 0px 0px 0px' : toSurface.shadow;
  tl.to(
    panel,
    { backgroundColor: toSurface.background, boxShadow: toShadow, duration: ms(CLOSE), ease },
    0,
  );
  tl.to(tint, { opacity: 0, duration: ms(CLOSE), ease: EASE_IN_STRONG }, 0);

  if (borrowsSurface) {
    // The trigger comes back underneath the shrinking panel, not with it.
    tl.fromTo(
      trigger,
      { opacity: 0 },
      { opacity: 1, duration: ms(TRIGGER_SHOW), ease: EASE_OUT_SOFT },
      ms(TRIGGER_SHOW_DELAY),
    );
  }

  const cleanupFlight = buildFlight(tl, plan, dialog, ms(CLOSE), EASE_FLOW, 'close');

  return settle(tl, () => {
    cleanupFlight();
    finish();
  });
}

export const MORPH_TIMING = { open: OPEN, close: CLOSE } as const;
