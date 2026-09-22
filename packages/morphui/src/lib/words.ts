import type { Box } from './measure.js';

export interface WordRect {
  text: string;
  box: Box;
  font: string;
  color: string;
  letterSpacing: string;
}

/**
 * Measures each word of an element without touching its DOM.
 *
 * The original splits the text into spans and animates those. That is fine for a
 * page you own, but a library must not rewrite a consumer's markup - React would
 * clobber it on the next render, and the user's own styles may target the text
 * node. A Range over the existing text nodes gives the same per-word rectangles
 * with nothing mutated.
 */
export function measureWords(element: Element): WordRect[] {
  const style = getComputedStyle(element);
  const font = style.font || `${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily}`;
  const rects: WordRect[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent;
    if (!text || !text.trim()) continue;

    // Word boundaries within this text node, as [start, end) offsets.
    const pattern = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text))) {
      const range = document.createRange();
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const rect = range.getBoundingClientRect();
      range.detach();
      if (rect.width === 0 && rect.height === 0) continue;
      rects.push({
        text: match[0],
        box: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        font,
        color: style.color,
        letterSpacing: style.letterSpacing,
      });
    }
  }
  return rects;
}

/**
 * Builds one absolutely positioned clone per word pair, parked at the `from`
 * rectangle. The caller animates them to `to` and then drops the layer.
 *
 * Pairing is positional: first word to first word. Words beyond the shorter of
 * the two lists have nothing to travel to, so they are left out and cross-fade
 * with their container instead.
 */
export function spawnWordClones(from: WordRect[], to: WordRect[]): {
  layer: HTMLElement;
  clones: HTMLElement[];
  targets: Box[];
  scales: number[];
} {
  const layer = document.createElement('div');
  layer.setAttribute('data-morph-word-layer', '');
  layer.setAttribute('aria-hidden', 'true');

  const clones: HTMLElement[] = [];
  const targets: Box[] = [];
  const scales: number[] = [];
  const count = Math.min(from.length, to.length);

  for (let i = 0; i < count; i++) {
    const a = from[i]!;
    const b = to[i]!;
    const clone = document.createElement('span');
    clone.textContent = a.text;
    clone.style.cssText = [
      'position:fixed',
      'margin:0',
      'padding:0',
      'white-space:pre',
      'transform-origin:left top',
      'will-change:transform',
      `left:${a.box.x}px`,
      `top:${a.box.y}px`,
      `font:${b.font}`,
      `letter-spacing:${b.letterSpacing}`,
      `color:${b.color}`,
    ].join(';');
    layer.append(clone);
    clones.push(clone);
    targets.push(b.box);
    // The clone is rendered at the target's font size, so it only has to travel -
    // the scale corrects for the size difference at the start.
    scales.push(a.box.height / b.box.height || 1);
  }

  return { layer, clones, targets, scales };
}
