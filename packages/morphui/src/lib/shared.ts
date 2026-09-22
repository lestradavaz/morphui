import type { Box } from './measure.js';

export interface ItemPair {
  source: HTMLElement;
  target: HTMLElement;
  sourceBox: Box;
  targetBox: Box;
}

export interface WordClone {
  clone: HTMLElement;
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
export function buildWordClones(
  sourceInk: Box[],
  targetInk: Box[],
  land: Element,
  host: HTMLElement,
): { layer: HTMLElement; clones: WordClone[] } | null {
  const count = Math.min(sourceInk.length, targetInk.length);
  if (count === 0) return null;

  const words = wordsOf(land);
  const style = getComputedStyle(land);
  const layer = document.createElement('div');
  layer.setAttribute('data-morph-word-layer', '');
  layer.setAttribute('aria-hidden', 'true');
  host.append(layer);

  const clones: WordClone[] = [];
  for (let i = 0; i < count; i++) {
    const clone = document.createElement('span');
    clone.textContent = words[i] ?? '';
    clone.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'margin:0',
      'padding:0',
      'white-space:pre',
      'transform-origin:left top',
      'will-change:transform',
      `font:${style.font}`,
      `letter-spacing:${style.letterSpacing}`,
      `color:${style.color}`,
    ].join(';');
    layer.append(clone);

    const ink = measureWordInk(clone)[0] ?? { x: 0, y: 0, width: 0, height: 0 };
    const targetBox = targetInk[i]!;
    clone.style.left = `${targetBox.x - ink.x}px`;
    clone.style.top = `${targetBox.y - ink.y}px`;

    clones.push({ clone, sourceBox: sourceInk[i]!, targetBox });
  }

  return { layer, clones };
}
