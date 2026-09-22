import type { Box } from './measure.js';

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
 * The real destination element is what moves: it starts parked on the source's
 * box and animates to its own. Nothing is cloned, so icons, images and text all
 * behave, and the element lands on itself with nothing to hand over to.
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
    entry.in.style.left = `${entry.targetBox.x - inInk.x}px`;
    entry.in.style.top = `${entry.targetBox.y - inInk.y}px`;
    return entry;
  });

  return { layer, pairs };
}
