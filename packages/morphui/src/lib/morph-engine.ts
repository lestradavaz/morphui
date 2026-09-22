import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

import { EASE_FLOW, EASE_FLOW_CLOSE, EASE_IN_STRONG, EASE_OUT_SOFT, registerMorphEases } from './easing.js';
import { box, prefersReducedMotion, slowFactor, surface, type Box } from './measure.js';
import { buildWordClones, collectItems } from './shared.js';

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
function driveShape(
  timeline: gsap.core.Timeline,
  panel: HTMLElement,
  content: HTMLElement,
  fromScale: { x: number; y: number },
  toScale: { x: number; y: number },
  radius: number,
  duration: number,
  ease: string,
): void {
  const driver = { t: 0 };
  const curve = gsap.parseEase(ease);
  timeline.to(
    driver,
    {
      t: 1,
      duration,
      ease: 'none',
      onUpdate: () => {
        const p = curve(driver.t);
        const sx = lerp(fromScale.x, toScale.x, p) || 1;
        const sy = lerp(fromScale.y, toScale.y, p) || 1;
        gsap.set(content, { scaleX: 1 / sx, scaleY: 1 / sy });
        gsap.set(panel, { borderRadius: `${radius / sx}px / ${radius / sy}px` });
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

interface FlightOptions {
  origin: HTMLElement;
  panel: HTMLElement;
  host: HTMLElement;
  shareWords: boolean;
  duration: number;
  ease: string;
  phase: 'open' | 'close';
}

/**
 * Shared pieces, in whichever direction the panel is going.
 *
 * Marked items are real elements, so the one inside the panel is what moves and
 * its counterpart in the trigger is simply hidden. Words are stand-ins, always
 * parked at their destination and tweened `from` the origin, so the same call
 * serves both phases - only which end is which changes.
 */
function prepareFlight(timeline: gsap.core.Timeline, options: FlightOptions): () => void {
  const { origin, panel, host, shareWords, duration, ease, phase } = options;
  const opening = phase === 'open';
  const undo: (() => void)[] = [];

  const items = collectItems(origin, panel);
  for (const { source, target, sourceBox, targetBox } of items) {
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
  if (items.length) {
    undo.push(() => {
      for (const { source, target } of items) {
        gsap.set(source, { clearProps: 'visibility' });
        gsap.set(target, { clearProps: 'transform' });
      }
    });
  }

  if (shareWords) {
    const heading = panel.querySelector<HTMLElement>('[data-morph-words]');
    if (heading) {
      const start = opening ? origin : heading;
      const land = opening ? heading : origin;
      const built = buildWordClones(start, land, host);
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
        // goes outright; the trigger only loses its ink, so its box can still
        // fade on its own schedule.
        gsap.set(heading, { opacity: 0 });
        gsap.set(origin, { color: 'transparent' });
        undo.push(() => {
          built.layer.remove();
          gsap.set(heading, { clearProps: 'opacity' });
          gsap.set(origin, { clearProps: 'color' });
        });
      }
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
  freezeContent(content, to);

  const tl = Flip.from(state, {
    targets: panel,
    scale: true,
    duration: ms(OPEN),
    ease: EASE_FLOW,
    toggleClass: isWindow ? 'morph-window-opening' : 'morph-opening',
  });

  driveShape(
    tl,
    panel,
    content,
    { x: from.width / to.width, y: from.height / to.height },
    { x: 1, y: 1 },
    toRadius,
    ms(OPEN),
    EASE_FLOW,
  );

  if (!isWindow) {
    tl.from(panel, { backgroundColor: fromSurface.background, duration: ms(OPEN) / 2.33, ease: EASE_FLOW }, 0);
    tl.to(trigger, { opacity: 0, duration: ms(TRIGGER_HIDE), ease: 'none' }, 0);
  }

  tl.from(tint, { opacity: 0, duration: ms(isWindow ? TINT_WINDOW : TINT), ease: EASE_FLOW }, 0);

  const cleanupFlight = prepareFlight(tl, {
    origin: trigger,
    panel,
    host: dialog,
    shareWords: !!config.shareWords,
    duration: ms(OPEN),
    ease: EASE_FLOW,
    phase: 'open',
  });

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

  driveShape(
    tl,
    panel,
    content,
    { x: 1, y: 1 },
    { x: to.width / from.width, y: to.height / from.height },
    fromRadius,
    ms(CLOSE),
    ease,
  );

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

  const cleanupFlight = prepareFlight(tl, {
    origin: trigger,
    panel,
    host: dialog,
    shareWords: !!config.shareWords,
    duration: ms(CLOSE),
    ease,
    phase: 'close',
  });

  return settle(tl, () => {
    cleanupFlight();
    finish();
  });
}

export const MORPH_TIMING = { open: OPEN, close: CLOSE } as const;
