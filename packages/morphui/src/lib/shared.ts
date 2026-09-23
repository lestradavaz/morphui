import { surface, type Box } from './measure.js';

export interface ItemPair {
  source: HTMLElement;
  target: HTMLElement;
  sourceBox: Box;
  targetBox: Box;
}

export interface WordPair {
  /** Styled like the origin. Fades out as it travels. */
  out: HTMLElement;
  /** Styled like the destination. Fades in over the same path. */
  in: HTMLElement;
  sourceBox: Box;
  targetBox: Box;
}

const rectOf = (r: DOMRect): Box => ({ x: r.left, y: r.top, width: r.width, height: r.height });

/**
 * Elements marked `data-morph-item="name"` on both sides travel as one piece.
 *
 * Measure both endpoints before Flip transforms the panel. Their visual copies
 * travel in the dialog's top layer, outside the content's fade, blur and lag.
 */
export function collectItems(origin: Element, panel: Element): ItemPair[] {
  const pairs: ItemPair[] = [];
  for (const source of origin.querySelectorAll<HTMLElement>('[data-morph-item]')) {
    const name = source.dataset.morphItem;
    if (!name) continue;
    const target = panel.querySelector<HTMLElement>(`[data-morph-item="${CSS.escape(name)}"]`);
    if (!target) continue;
    pairs.push({
      source,
      target,
      sourceBox: rectOf(source.getBoundingClientRect()),
      targetBox: rectOf(target.getBoundingClientRect()),
    });
  }
  return pairs;
}

/** Copy the resolved appearance, including styles inherited from either theme. */
function visualCopy(model: HTMLElement): HTMLElement {
  const copy = model.cloneNode(true) as HTMLElement;
  const originals = [model, ...model.querySelectorAll<HTMLElement>('*')];
  const copies = [copy, ...copy.querySelectorAll<HTMLElement>('*')];
  originals.forEach((original, index) => {
    const node = copies[index]!;
    const style = getComputedStyle(original);
    node.removeAttribute('id');
    node.removeAttribute('data-morph-item');
    node.removeAttribute('data-morph-words');
    for (const property of style) node.style.setProperty(property, style.getPropertyValue(property));
    node.style.animation = 'none';
    node.style.transition = 'none';
  });
  Object.assign(copy.style, {
    position: 'absolute', inset: '0', width: '100%', height: '100%',
    minWidth: '0', minHeight: '0', maxWidth: 'none', maxHeight: 'none',
    margin: '0', transform: 'none', visibility: 'visible', opacity: '1',
  });
  return copy;
}

/** Top-left, top-right, bottom-right, bottom-left, in that order. */
type Corners = [number, number, number, number];

const CORNERS = [
  { name: 'borderTopLeftRadius', edges: ['left', 'top'] },
  { name: 'borderTopRightRadius', edges: ['right', 'top'] },
  { name: 'borderBottomRightRadius', edges: ['right', 'bottom'] },
  { name: 'borderBottomLeftRadius', edges: ['left', 'bottom'] },
] as const;

const edgeOf = (r: { x: number; y: number; width: number; height: number }, edge: string): number =>
  edge === 'left' ? r.x : edge === 'right' ? r.x + r.width : edge === 'top' ? r.y : r.y + r.height;

/**
 * The corners the element is actually painted with, corner by corner.
 *
 * A full-bleed image usually has no radius of its own: the card around it does,
 * and clips. Which of the image's corners that rounds depends on which of its
 * edges the card shares - an image across the top of a card with a caption under
 * it is rounded at the top and square at the bottom.
 *
 * Asking for all four edges to line up, as this did, throws the card's radius
 * away the moment anything else sits inside it, and the image then flies square
 * while the card it came from is visibly round.
 */
function clippedCorners(element: HTMLElement, rect: Box): Corners {
  const own = getComputedStyle(element);
  const corners = CORNERS.map((c) => Number.parseFloat(own[c.name]) || 0) as Corners;

  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    if (!/(hidden|clip)/.test(style.overflow)) continue;
    const bounds = parent.getBoundingClientRect();
    CORNERS.forEach((corner, i) => {
      const shared = corner.edges.every((edge) => Math.abs(edgeOf(bounds, edge) - edgeOf(rect, edge)) < 1);
      if (shared) corners[i] = Math.max(corners[i]!, Number.parseFloat(style[corner.name]) || 0);
    });
  }

  // Whatever is declared, a corner is painted no larger than the box allows.
  const limit = Math.min(rect.width, rect.height) / 2;
  return corners.map((r) => Math.min(r, limit)) as Corners;
}

/** Independent visual layer; originals keep their React ownership and layout. */
export function buildItemFlight(pair: ItemPair, host: HTMLElement, opening: boolean) {
  const from = opening ? pair.sourceBox : pair.targetBox;
  const to = opening ? pair.targetBox : pair.sourceBox;
  const source = opening ? pair.source : pair.target;
  const target = opening ? pair.target : pair.source;
  const fromCorners = clippedCorners(source, from);
  const toCorners = clippedCorners(target, to);
  const layer = document.createElement('div');
  layer.setAttribute('data-morph-item-layer', '');
  layer.setAttribute('aria-hidden', 'true');
  layer.inert = true;
  layer.style.isolation = 'isolate';

  const wrap = (model: HTMLElement, rect: Box, role: string) => {
    const wrapper = document.createElement('div');
    wrapper.dataset.morphFlight = role;
    Object.assign(wrapper.style, {
      position: 'fixed', left: `${rect.x}px`, top: `${rect.y}px`,
      width: `${rect.width}px`, height: `${rect.height}px`, overflow: 'hidden',
      transformOrigin: 'top left', mixBlendMode: 'plus-lighter',
      willChange: 'transform, opacity',
    });
    wrapper.append(visualCopy(model));
    layer.append(wrapper);
    return wrapper;
  };
  const outgoing = wrap(source, from, 'outgoing');
  const incoming = wrap(target, to, 'incoming');
  const saved = [pair.source, pair.target].map((element) => ({
    element, value: element.style.getPropertyValue('visibility'),
    priority: element.style.getPropertyPriority('visibility'),
  }));
  for (const { element } of saved) element.style.visibility = 'hidden';
  host.append(layer);

  return {
    from, to, outgoing, incoming,
    setProgress(progress: number) {
      const width = from.width + (to.width - from.width) * progress;
      const height = from.height + (to.height - from.height) * progress;
      const live = fromCorners.map((r, i) => r + (toCorners[i]! - r) * progress);

      /*
       * Each copy is drawn at its own size and scaled to the flight's, so the
       * radius it is given has to be divided back by that scale to paint the
       * one wanted on screen. Per axis, hence the two-value form: the corners
       * would otherwise go oval as soon as the two scales differ.
       */
      const write = (el: HTMLElement, rect: Box) => {
        const x = live.map((r) => `${r * rect.width / width}px`).join(' ');
        const y = live.map((r) => `${r * rect.height / height}px`).join(' ');
        el.style.borderRadius = `${x} / ${y}`;
      };
      write(outgoing, from);
      write(incoming, to);
    },
    cleanup() {
      for (const { element, value, priority } of saved) {
        if (value) element.style.setProperty('visibility', value, priority);
        else element.style.removeProperty('visibility');
      }
      layer.remove();
    },
  };
}

/** The ink box of every word in an element, measured without touching its DOM. */
export function measureWordInk(element: Element): Box[] {
  const boxes: Box[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent;
    if (!text || !text.trim()) continue;
    const pattern = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text))) {
      const range = document.createRange();
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const rect = range.getBoundingClientRect();
      range.detach();
      if (rect.width || rect.height) boxes.push(rectOf(rect));
    }
  }
  return boxes;
}

function wordsOf(element: Element): string[] {
  return (element.textContent ?? '').trim().split(/\s+/).filter(Boolean);
}

/**
 * One stand-in per word, aligned by ink rather than by box.
 *
 * A clone is a span carrying the destination's font, so its line box is taller
 * than the glyphs inside it - a 30px/45px heading leaves about 5px of leading
 * above the ink. Positioning that span by its box at a rectangle that was
 * measured from ink drops the text a few pixels, and the offset only becomes
 * visible at the very end, when the stand-in goes and the real heading appears:
 * the label lands and then hops.
 *
 * So each clone is parked at the origin, its own ink is measured, and the
 * difference is taken out. Whatever the two fonts' metrics are, ink lands on ink.
 */
function cloneStyle(model: Element): string {
  const style = getComputedStyle(model);
  return [
    'position:fixed',
    'left:0',
    'top:0',
    'margin:0',
    'padding:0',
    'white-space:pre',
    'transform-origin:left top',
    'will-change:transform,opacity',
    // Two stand-ins for the same word overlap for the whole trip. Plain opacity
    // would dip at the halfway point, where both sit at 50% and the word visibly
    // thins out. Additive blending keeps the total constant, which is what the
    // browser does for a shared element and what makes the swap read as one
    // word changing rather than two words trading places.
    'mix-blend-mode:plus-lighter',
    `font:${style.font}`,
    `letter-spacing:${style.letterSpacing}`,
    `color:${style.color}`,
  ].join(';');
}

/**
 * Two stand-ins per word, one wearing each end's typography.
 *
 * A shared element in a view transition is a pair: the old snapshot and the new
 * one, both riding the same box, cross-fading as they go. A single clone in the
 * destination's font cannot do that - it arrives already looking like where it
 * landed, so the change of size and weight happens instantly at the start
 * instead of resolving across the trip.
 */
export function buildWordClones(
  sourceInk: Box[],
  targetInk: Box[],
  source: Element,
  land: Element,
  host: HTMLElement,
): { layer: HTMLElement; pairs: WordPair[] } | null {
  const count = Math.min(sourceInk.length, targetInk.length);
  if (count === 0) return null;

  const words = wordsOf(land);
  const outCss = cloneStyle(source);
  const inCss = cloneStyle(land);

  const layer = document.createElement('div');
  layer.setAttribute('data-morph-word-layer', '');
  layer.setAttribute('aria-hidden', 'true');
  // Keeps the additive blending between each word's own pair, instead of letting
  // it spill onto whatever is behind the panel.
  layer.style.isolation = 'isolate';

  // Build everything, then measure everything, then place everything: reading
  // between two writes forces a synchronous layout once per element.
  const pending: { out: HTMLElement; in: HTMLElement; sourceBox: Box; targetBox: Box }[] = [];
  for (let i = 0; i < count; i++) {
    const text = words[i] ?? '';
    const out = document.createElement('span');
    out.textContent = text;
    out.style.cssText = outCss;
    const into = document.createElement('span');
    into.textContent = text;
    into.style.cssText = inCss;
    layer.append(out, into);
    pending.push({ out, in: into, sourceBox: sourceInk[i]!, targetBox: targetInk[i]! });
  }

  host.append(layer);

  const inks = pending.flatMap(({ out, in: into }) => [
    measureWordInk(out)[0] ?? { x: 0, y: 0, width: 0, height: 0 },
    measureWordInk(into)[0] ?? { x: 0, y: 0, width: 0, height: 0 },
  ]);

  const pairs: WordPair[] = pending.map((entry, i) => {
    const outInk = inks[i * 2]!;
    const inInk = inks[i * 2 + 1]!;
    // Each lands by its ink, not its box: a line box carries leading the glyphs
    // do not, so placing by box drops the text a few pixels.
    entry.out.style.left = `${entry.sourceBox.x - outInk.x}px`;
    entry.out.style.top = `${entry.sourceBox.y - outInk.y}px`;
    entry.out.style.transformOrigin = `${outInk.x}px ${outInk.y}px`;
    entry.in.style.left = `${entry.targetBox.x - inInk.x}px`;
    entry.in.style.top = `${entry.targetBox.y - inInk.y}px`;
    entry.in.style.transformOrigin = `${inInk.x}px ${inInk.y}px`;
    return entry;
  });

  return { layer, pairs };
}
