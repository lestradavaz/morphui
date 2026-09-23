import { expect, test, type Page } from '@playwright/test';

// Observe running frames. Do not seek timelines: that can suppress callbacks
// and does not exercise CSS animations on the same clock as GSAP.
async function flight(page: Page, action: string, words = false) {
  return page.evaluate(async ({ action, words }) => {
    const rect = (r: DOMRect) => ({ x: r.x, y: r.y, width: r.width, height: r.height });
    const measure = (element: Element) => {
      if (!words) return rect(element.getBoundingClientRect());
      const range = document.createRange();
      range.selectNodeContents(element);
      return rect(range.getBoundingClientRect());
    };
    const rows: { boxes: ReturnType<typeof rect>[]; opacity: number[]; independent: boolean }[] = [];
    (document.querySelector(action) as HTMLElement).click();
    await new Promise<void>((resolve, reject) => {
      const start = performance.now();
      let seen = false;
      function sample() {
        const layer = document.querySelector(words ? '[data-morph-word-layer]' : '[data-morph-item-layer]');
        if (layer) {
          seen = true;
          const elements = [...layer.children];
          rows.push({
            boxes: elements.map(measure),
            opacity: elements.map((e) => Number(getComputedStyle(e).opacity)),
            independent: layer.parentElement?.tagName === 'DIALOG' && !layer.closest('.morph-panel-content'),
          });
        } else if (seen) { resolve(); return; }
        if (performance.now() - start > 6000) { reject(new Error('Shared flight never appeared or was not cleaned up')); return; }
        requestAnimationFrame(sample);
      }
      sample();
    });
    return rows;
  }, { action, words });
}

function nearBox(actual: { x: number; y: number; width: number; height: number }, expected: typeof actual, tolerance = 1) {
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(actual[key] - expected[key]), `${key}: ${actual[key]} vs ${expected[key]}`).toBeLessThan(tolerance);
  }
}

function continuous(rows: Awaited<ReturnType<typeof flight>>) {
  expect(rows.length).toBeGreaterThan(8);
  for (const frame of rows) {
    expect(frame.independent).toBe(true);
    for (let i = 0; i < frame.boxes.length; i += 2) {
      nearBox(frame.boxes[i]!, frame.boxes[i + 1]!, 0.5);
      expect(frame.opacity[i]! + frame.opacity[i + 1]!).toBeCloseTo(1, 3);
    }
  }
}

async function wordBoxes(page: Page, selector: string) {
  return page.locator(selector).evaluate((element) => {
    const boxes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const pattern = /\S+/g;
      let match;
      while ((match = pattern.exec(node.textContent ?? ''))) {
        const range = document.createRange();
        range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
        const r = range.getBoundingClientRect();
        boxes.push({ x: r.x, y: r.y, width: r.width, height: r.height });
      }
    }
    return boxes;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('dialog').first().locator('h2')).toHaveCount(1);
  await page.evaluate(() => document.documentElement.style.setProperty('--morph-slow', '2'));
});

test('card image stays visible, travels back to the card and survives repeated cycles', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const trigger = page.locator('button.card');
  await trigger.scrollIntoViewIfNeeded();
  for (let cycle = 0; cycle < 2; cycle++) {
    const source = (await trigger.locator('.art').boundingBox())!;
    const opening = await flight(page, 'button.card');
    continuous(opening);
    nearBox(opening[0]!.boxes[0]!, source, 8);
    const target = (await page.locator('dialog[open] .art-full').boundingBox())!;
    nearBox(opening.at(-1)!.boxes[1]!, target);
    await expect(page.locator('dialog[open] .art-full')).toBeVisible();
    const closing = await flight(page, 'dialog[open] .closer');
    continuous(closing);
    nearBox(closing[0]!.boxes[0]!, target, 8);
    nearBox(closing.at(-1)!.boxes[1]!, source);
    expect(closing.at(-1)!.opacity[1]).toBeGreaterThan(0.99);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(trigger).toHaveCSS('opacity', '1');
    await expect(trigger.locator('.art')).toHaveCSS('visibility', 'visible');
    await expect(page.locator('[data-morph-item-layer]')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

for (const [name, selector] of [['window', 'button.chip'], ['dialog', '.stage > .row > button.pill']] as const) {
  test(`${name} label remains aligned throughout opening and closing`, async ({ page }) => {
    await page.locator(selector).first().scrollIntoViewIfNeeded();
    const source = await wordBoxes(page, selector);
    const opening = await flight(page, selector, true);
    continuous(opening);
    const target = await wordBoxes(page, 'dialog[open] [data-morph-words]');
    for (let i = 0; i < source.length; i++) {
      nearBox(opening[0]!.boxes[2 * i]!, source[i]!, 8);
      nearBox(opening.at(-1)!.boxes[2 * i + 1]!, target[i]!);
    }
    const panel = (await page.locator('dialog[open] .morph-panel').boundingBox())!;
    const closer = (await page.locator('dialog[open] .closer').boundingBox())!;
    expect(panel.x + panel.width - closer.x - closer.width).toBeCloseTo(20, 0);
    expect(closer.y - panel.y).toBeCloseTo(20, 0);
    const closing = await flight(page, 'dialog[open] .closer', true);
    continuous(closing);
    for (let i = 0; i < source.length; i++) nearBox(closing.at(-1)!.boxes[2 * i + 1]!, source[i]!);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.locator(selector).first()).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-morph-word-layer]')).toHaveCount(0);
  });
}

test('reduced motion and Escape leave both triggers intact', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const selector of ['button.chip', 'button.card']) {
    await page.locator(selector).click();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await page.waitForTimeout(350);
    await expect(page.locator('[data-morph-word-layer], [data-morph-item-layer]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.locator(selector)).toHaveCSS('opacity', '1');
  }
});
