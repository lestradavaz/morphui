import { readFileSync, readdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/* Read from the manifest, not written out: a rename or a version bump must not
   need the assertions edited to keep passing. */
const pkg = JSON.parse(readFileSync(new URL('../packages/morphui/package.json', import.meta.url), 'utf8')) as { name: string; version: string };
/* The pages are read off the directory for the same reason. A page that was
   written and never added to a list in a test is a page nothing checks. */
const routes = [
  '/',
  ...readdirSync(new URL('../apps/docs/src/content/docs', import.meta.url))
    .filter(name => name.endsWith('.md'))
    .map(name => `/docs/${name.replace(/\.md$/, '')}`)
    .sort(),
];

/**
 * Clicks land before React attaches its listeners if the page is still hydrating,
 * which silently does nothing and looks like a broken control. Loading the page
 * under a busy suite is enough to lose that race, so wait for the islands first.
 */
const hydrate = async (page: Page): Promise<void> => {
  await page.locator('astro-island').first().waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('astro-island')].every(island => !island.hasAttribute('ssr')));
};

test('every documentation route has content, metadata and no page overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('meta[name=description]')).toHaveAttribute('content', /\S+/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    // The canonical has to match the URL the page is served at, and the sitemap
    // has to agree. It previously declared the emitted filename instead, so a
    // page at /docs/installation called itself /docs/installation.html.
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `https://morphui.lestradavaz.com${route === '/' ? '/' : route}`);
    await expect(page.locator('link[rel=canonical]')).not.toHaveAttribute('href', /\.html$/);
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /^index, follow/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const href of await page.locator('.docs-toc a').evaluateAll(links => links.map(link => link.getAttribute('href')!))) {
      await expect(page.locator(href)).toHaveCount(1);
    }
  }
  expect(errors).toEqual([]);
});

test('previews hydrate, keep colors scoped and open all three packaged components', async ({ page }) => {
  await page.goto('/');
  await hydrate(page);
  const rootAccent = await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--morph-accent'));
  const accents = new Set<string>();
  for (const theme of ['ink','green','cobalt','terracotta','teal','crimson','plum']) {
    await page.getByLabel('Preview color theme').selectOption(theme);
    accents.add(await page.locator('.preview-stage').evaluate(el => getComputedStyle(el).getPropertyValue('--morph-accent')));
  }
  expect(accents.size).toBe(7);
  expect(await page.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--morph-accent'))).toBe(rootAccent);
  await page.getByRole('button',{name:'Dark',exact:true}).click();
  // The token, not the attribute: the attribute is deliberately left off when
  // the system already resolves to what was asked for.
  await expect.poll(() => page.locator('.preview-stage').evaluate(
    el => getComputedStyle(el).getPropertyValue('--morph-bg').trim().toLowerCase().startsWith('#f') ? 'light' : 'dark',
  )).toBe('dark');
  for (const [tab, trigger, close] of [['Dialog','Create account','Close dialog'],['Window','A little context','Close window'],['Card','Open A study in motion','Close story']]) {
    await page.getByRole('button',{name:tab,exact:true}).click();
    await page.getByRole('button',{name:trigger,exact:true}).click();
    await expect(page.locator('.morph-dialog[open]')).toHaveCount(1);
    await page.waitForTimeout(1350);
    const dialogTheme = await page.locator('.morph-dialog[open]').evaluate(el=>getComputedStyle(el).getPropertyValue('--morph-accent'));
    expect(dialogTheme.trim().toLowerCase()).toBe('#c9a6e8');
    await page.getByRole('button',{name:close,exact:true}).click();
    await expect(page.locator('.morph-dialog[open]')).toHaveCount(0);
  }
});

/**
 * Every control on the anchored pages opens something, so every one of them is
 * a place where a measurement taken too early shows up as content that does not
 * fit the box it was given: the surface is measured once and then held while it
 * is scaled, and a box a row too short clips the last row rather than growing.
 * The surface's own scroll height is what says whether the box matches.
 */
test('the anchored surfaces open out of their trigger, fit their content, and close', async ({ page }) => {
  const controls: { route: string; open: (page: Page) => Promise<void>; what: string }[] = [
    { route: '/docs/morph-popover', what: 'popover', open: async p => { await p.getByRole('button', { name: /Notification settings/ }).first().click(); } },
    { route: '/docs/morph-context-menu', what: 'menu', open: async p => { await p.locator('.demo-file').first().click(); } },
    { route: '/docs/morph-combobox', what: 'list', open: async p => { await p.locator('.morph-combobox__field').first().click(); } },
    { route: '/docs/morph-multi-select', what: 'list', open: async p => { await p.locator('.morph-multi-select__field').first().click(); } },
  ];

  for (const { route, open, what } of controls) {
    await page.goto(route);
    await hydrate(page);
    await open(page);

    const surface = page.locator('.morph-anchored').first();
    await expect(surface).toHaveCount(1);
    // Settled, and big enough to be a panel rather than a line.
    await page.waitForTimeout(1200);
    const box = await surface.boundingBox();
    expect(box!.height, `${route}: ${what} opened too small`).toBeGreaterThan(80);
    expect(await surface.evaluate(el => el.scrollHeight - el.clientHeight), `${route}: ${what} is taller than its box`).toBeLessThanOrEqual(1);

    await page.keyboard.press('Escape');
    await expect(page.locator('.morph-anchored')).toHaveCount(0);
  }
});

test('a tooltip answers the pointer and the keyboard, and belongs to one control', async ({ page }) => {
  await page.goto('/docs/morph-tooltip');
  await hydrate(page);

  // Focus, not hover: this has to hold where there is no pointer at all.
  const control = page.getByRole('button', { name: 'Inspect motion' }).first();
  await control.focus();
  await expect(page.locator('.morph-tooltip__bubble[data-open=true]')).toHaveCount(1);

  await page.keyboard.press('Escape');
  await expect(page.locator('.morph-tooltip__bubble[data-open=true]')).toHaveCount(0);
});

/* Four controls change their own size, which is the one thing a control on a
   page is not allowed to make everyone else pay for. */
test('a control that resizes itself leaves the rest of the page where it was', async ({ page }) => {
  await page.goto('/docs/morph-save-button');
  await hydrate(page);
  const save = page.locator('.morph-save-button').first();
  const saveNote = await page.locator('.preview-stage .demo-note').boundingBox();
  const wide = (await save.boundingBox())!.width;
  await save.click();
  await page.waitForTimeout(1000);
  const narrow = (await save.boundingBox())!.width;
  expect(narrow, 'the saved face did not make the button narrower').toBeLessThan(wide - 20);
  expect((await page.locator('.preview-stage .demo-note').boundingBox())!.y, 'the line under the button moved').toBe(saveNote!.y);

  await page.goto('/docs/morph-expand');
  await hydrate(page);
  const expand = page.locator('.morph-expand').first();
  const expandNote = await page.locator('.preview-stage .demo-note').boundingBox();
  const closed = (await expand.boundingBox())!.width;
  await page.locator('.morph-expand__trigger').click();
  await page.waitForTimeout(1000);
  expect((await expand.boundingBox())!.width, 'the control did not widen to hold its actions').toBeGreaterThan(closed + 60);
  expect((await page.locator('.preview-stage .demo-note').boundingBox())!.y, 'the line under the control moved').toBe(expandNote!.y);
  // The height is the one thing that must not change: this opens sideways.
  expect(Math.round((await expand.boundingBox())!.height)).toBe(48);
});

test('a stepper gives the space to the number when a button runs out of room', async ({ page }) => {
  await page.goto('/docs/morph-stepper');
  await hydrate(page);
  const stepper = page.locator('.morph-stepper').first();
  const read = () => stepper.evaluate(el => {
    const display = el.querySelector<HTMLElement>('.morph-stepper__display')!;
    const increase = el.querySelector<HTMLElement>('button[aria-label="Increase"]')!;
    return { track: Math.round(el.getBoundingClientRect().width), display: Math.round(display.getBoundingClientRect().width), increase: Number(getComputedStyle(increase).opacity) };
  });
  const start = await read();
  expect(start.increase).toBe(1);
  // The demo's own range is three, so this reaches the end of it.
  for (let press = 0; press < 4; press += 1) {
    await page.locator('.morph-stepper button[aria-label="Increase"]').first().click({ force: true });
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(700);
  const end = await read();
  expect(end.track, 'the control grew instead of handing over its own room').toBe(start.track);
  expect(end.display, 'the number did not take the room the plus left').toBeGreaterThan(start.display + 30);
  expect(end.increase, 'the plus is still on screen at the top of the range').toBe(0);
});

test('a hold button confirms only when the press is held', async ({ page }) => {
  await page.goto('/docs/morph-hold-button');
  await hydrate(page);
  const button = page.locator('.morph-hold-button').first();
  const bounds = (await button.boundingBox())!;
  const press = async (ms: number) => {
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(ms);
    await page.mouse.up();
    await page.waitForTimeout(250);
  };

  // Released early: the fill goes back and nothing has happened.
  await press(250);
  await expect(button).toHaveAttribute('data-confirmed', 'false');
  const travelled = await page.locator('.morph-hold-button__progress').first().evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a);
  expect(travelled, 'the fill did not go back to the start').toBeLessThan(0.05);

  await press(1100);
  await expect(button).toHaveAttribute('data-confirmed', 'true');
});

test('search and site appearance work across navigation', async ({ page }) => {
  await page.goto('/');
  await hydrate(page);
  await page.getByRole('button',{name:'Search documentation',exact:true}).click();
  await page.getByLabel('Search documentation pages').fill('window');
  await expect(page.getByRole('navigation',{name:'Search results'}).getByRole('link')).toHaveCount(1);
  await page.getByRole('navigation',{name:'Search results'}).getByRole('link').click();
  await expect(page).toHaveURL(/\/docs\/morph-window$/);
  await page.getByLabel('Site appearance').selectOption('dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-morph-mode','dark');
  await page.getByRole('button',{name:'Search documentation',exact:true}).click();
  await page.getByLabel('Search documentation pages').fill('no-such-component');
  await expect(page.locator('.search-empty')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.search-dialog')).not.toBeVisible();
});

test('installation names the published package and copies the selected command', async ({ page, context, request }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/docs/installation');
  await hydrate(page);
  await page.getByRole('button',{name:'pnpm',exact:true}).click();
  await expect(page.locator('.install-code code')).toHaveText(`pnpm add ${pkg.name} gsap`);
  await page.locator('.install-code').getByRole('button',{name:'Copy',exact:true}).click();
  await expect(page.locator('.copy-feedback')).toHaveText('Copied');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(`pnpm add ${pkg.name} gsap`);

  /*
   * The page sends people to npm, so the version it names has to be the one
   * that is there. A page offering 0.1.0 of something published as 0.2.0 sends
   * everyone to a different library than the one it just demonstrated.
   */
  const link = await page.getByRole('link',{name:'View on npm'}).getAttribute('href');
  expect(link).toBe(`https://www.npmjs.com/package/${pkg.name}`);
  const registry = await request.get(`https://registry.npmjs.org/${pkg.name.replace('/','%2F')}`);
  expect(registry.status()).toBe(200);
  expect((await registry.json())['dist-tags'].latest).toBe(pkg.version);
});

test('the hero carries a copyable install command for every package manager', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/');
  await hydrate(page);
  // The hero command is the reason a developer lands here, so it has to be the
  // real line and not a decorative one.
  const code = page.locator('.hero-install .install-code code');
  await expect(code).toHaveText(`npm install ${pkg.name} gsap`);
  // One package on one registry: every manager installs the same thing, so the
  // hero offers the choice rather than picking one and hiding the rest.
  for (const [manager, expected] of [['pnpm',`pnpm add ${pkg.name} gsap`],['yarn',`yarn add ${pkg.name} gsap`],['bun',`bun add ${pkg.name} gsap`]] as const) {
    await page.locator('.hero-install').getByRole('button',{name:manager,exact:true}).click();
    await expect(code).toHaveText(expected);
  }
  await page.locator('.hero-install').getByRole('button',{name:'Copy',exact:true}).click();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(`bun add ${pkg.name} gsap`);
  await expect(page.locator('.hero-install .copy-feedback')).toHaveText('Copied');
});

test('slow motion is local and CSS and geometry use the same multiplier', async ({ page }) => {
  await page.goto('/docs/morph-dialog');
  await hydrate(page);
  await page.getByRole('button',{name:'Slow motion',exact:true}).click();
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.locator('.morph-dialog[open]')).toHaveCount(1);
  const timing = await page.locator('.morph-dialog[open] .morph-panel-content').evaluate(el=>({duration:getComputedStyle(el).animationDuration,root:getComputedStyle(document.documentElement).getPropertyValue('--morph-slow')}));
  expect(timing.duration).toBe('3.5s');
  expect(timing.root.trim()).toBe('1');
  await page.waitForTimeout(900);
  const transform = await page.locator('.morph-dialog[open] .morph-panel').evaluate(el=>getComputedStyle(el).transform);
  expect(transform).not.toBe('none');
  await page.waitForTimeout(2800);
  await page.getByRole('button',{name:'Close dialog',exact:true}).click();
  await expect(page.locator('.morph-dialog[open]')).toHaveCount(0);
});

test('a close request during the opening animation is honoured, not swallowed', async ({ page }) => {
  await page.goto('/docs/morph-window');
  await hydrate(page);
  // No wait between the two: the close lands while the panel is still growing,
  // which is the whole point. Dropping it leaves a button that does nothing.
  await page.getByRole('button',{name:'A little context',exact:true}).click();
  await page.getByRole('button',{name:'Close window',exact:true}).click();
  await expect(page.locator('.morph-dialog[open]')).toHaveCount(1);
  await expect(page.locator('.morph-dialog[open]')).toHaveCount(0);
  // and the trigger is usable again afterwards
  await page.getByRole('button',{name:'A little context',exact:true}).click();
  await expect(page.locator('.morph-dialog[open]')).toHaveCount(1);
  await page.getByRole('button',{name:'Close window',exact:true}).click();
  await expect(page.locator('.morph-dialog[open]')).toHaveCount(0);
});

/**
 * Panel chrome keeps its own shape, its corner, and its visibility.
 *
 * Three regressions meet here, all of them only visible mid-flight. A button
 * kept inside the panel carried the panel's non-uniform scale, so it rendered 18
 * by 12 at the start of a dialog and squashed back down on the way out. Inside
 * the panel it was also painted under the flying image, because a transformed
 * panel is its own stacking context. And a card, whose trigger is already larger
 * than the button needs, has no reason to wait for it at all.
 */
test('the close button holds its size and its corner for the whole flight', async ({ page }) => {
  await page.goto('/docs/morph-card');
  await hydrate(page);
  await page.getByRole('button',{name:'Slow motion',exact:true}).click();

  // The chrome layer is a sibling of the panel, not a child of it.
  // Insets are checked to the pixel, not beyond it: the layer is placed from a
  // lerped box while the panel arrives by transform.
  const read = () => page.locator('.morph-dialog[open]').evaluate(dialog => {
    const panel = dialog.querySelector('.morph-panel')!;
    const closer = dialog.querySelector('.demo-close')!;
    const p = panel.getBoundingClientRect(), c = closer.getBoundingClientRect();
    let seen = 1;
    for (let el: Element | null = closer; el; el = el.parentElement) seen *= Number(getComputedStyle(el).opacity);
    return { panel: p.width, w: Math.round(c.width), h: Math.round(c.height), top: Math.round(c.y - p.y), right: Math.round(p.x + p.width - c.x - c.width), seen };
  });

  await page.getByRole('button',{name:'Open A study in motion',exact:true}).click();
  const arriving: number[] = [];
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(400);
    const at = await read();
    expect(at.w).toBe(38);
    expect(at.h).toBe(38);
    expect(Math.abs(at.top - 18)).toBeLessThanOrEqual(1);
    expect(Math.abs(at.right - 18)).toBeLessThanOrEqual(1);
    arriving.push(at.seen);
  }
  /*
   * It resolves rather than appears, on the panel's own beat: barely there while
   * the panel is still the card that was clicked, full strength by the time the
   * panel is. A reading that started high would mean a button drawn crisply over
   * the trigger; one that never climbed would mean it cut in at the end.
   */
  expect(arriving[0]!).toBeLessThan(0.5);
  for (let i = 1; i < arriving.length; i++) expect(arriving[i]!).toBeGreaterThanOrEqual(arriving[i - 1]!);
  expect(arriving.at(-1)!).toBeCloseTo(1, 1);

  /*
   * The full-screen corners run a 1200ms beat against the box's 700ms, so the
   * opening promise is still pending long after the panel has stopped moving,
   * and a close asked for before it resolves is queued rather than run. The
   * corners are what to watch, then: the box drops its transform when it lands,
   * but the radius is written inline until the whole transition is cleared.
   */
  await page.waitForFunction(() => {
    const panel = document.querySelector<HTMLElement>('.morph-dialog[open] .morph-panel');
    return !!panel && !panel.style.borderRadius;
  }, undefined, { timeout: 15_000 });

  await page.getByRole('button',{name:'Close story',exact:true}).click();
  const leaving: { panel: number; seen: number }[] = [];
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(400);
    const at = await read();
    expect(at.w).toBe(38);
    expect(at.h).toBe(38);
    expect(Math.abs(at.top - 18)).toBeLessThanOrEqual(1);
    expect(Math.abs(at.right - 18)).toBeLessThanOrEqual(1);
    leaving.push({ panel: at.panel, seen: at.seen });
  }
  // Still there as the panel starts back, and gone before it arrives: the button
  // leaves on its own beat rather than riding the box down to the card's size.
  expect(leaving[0]!.seen).toBeGreaterThan(0.3);
  expect(leaving.some(at => at.seen < 0.05)).toBe(true);
  await expect(page.locator('.morph-dialog[open]')).toHaveCount(0, { timeout: 15_000 });
});

/**
 * A live preview opens on the appearance the reader is already reading in.
 *
 * It used to open light whatever the site was doing, which on a dark page is a
 * white slab in the middle of the article. Following the header covers the
 * reader who picked a side and the reader who left it on System, and the pick
 * inside the preview still wins once it is made.
 */
for (const system of ['light', 'dark'] as const) {
  test.describe(`with a ${system} system`, () => {
    test.use({ colorScheme: system });
    const other = system === 'dark' ? 'light' : 'dark';
    // Read the token rather than the attribute: it is what the reader sees, and
    // the attribute is deliberately left off when the system already agrees.
    const shown = (page: Page) => page.locator('.preview-stage').first().evaluate(
      el => (getComputedStyle(el).getPropertyValue('--morph-bg').trim().toLowerCase().startsWith('#f') ? 'light' : 'dark'),
    );

    test('a preview opens in the appearance the header resolves to', async ({ page }) => {
      await page.goto('/docs/morph-dialog');
      await hydrate(page);
      expect(await shown(page)).toBe(system);

      await page.selectOption('#site-mode', other);
      await expect.poll(() => shown(page)).toBe(other);

      // The header remembers, so a fresh page opens there too.
      await page.goto('/docs/morph-window');
      await hydrate(page);
      await expect.poll(() => shown(page)).toBe(other);
    });

    test('a preview stops following once the reader picks inside it', async ({ page }) => {
      await page.goto('/docs/morph-dialog');
      await hydrate(page);
      await page.locator('.preview-controls').getByRole('button', { name: other === 'dark' ? 'Dark' : 'Light', exact: true }).click();
      await expect.poll(() => shown(page)).toBe(other);

      await page.selectOption('#site-mode', system === 'dark' ? 'light' : 'dark');
      await page.waitForTimeout(200);
      expect(await shown(page)).toBe(other);
    });
  });
}

/**
 * What a search engine and a social card are handed.
 *
 * The head used to carry a title, a description and a canonical and nothing
 * else: no share image, so every link posted anywhere rendered as a grey box,
 * and no structured data, so nothing tied the site to the package or to a
 * person. These are the parts that are easy to break silently, because the page
 * looks identical either way.
 */
test('every page ships a share card and a structured-data graph', async ({ page, request }) => {
  for (const route of routes) {
    await page.goto(route);
    const og = page.locator('meta[property="og:image"]');
    await expect(og).toHaveAttribute('content', /^https:\/\/morphui\.lestradavaz\.com\/og-image\.png$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    // The declared size has to be the real one or the card crops wrong.
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');

    const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
    const types = graph['@graph'].map((node: { '@type': string }) => node['@type']);
    expect(types).toContain('WebSite');
    expect(types).toContain('SoftwareSourceCode');
    expect(types).toContain('WebPage');

    // The nodes have to point at each other, which is the only part that makes
    // it a graph rather than three unrelated things sharing a page.
    const ids = new Set(graph['@graph'].map((node: { '@id': string }) => node['@id']));
    const website = graph['@graph'].find((n: { '@type': string }) => n['@type'] === 'WebSite');
    const webpage = graph['@graph'].find((n: { '@type': string }) => n['@type'] === 'WebPage');
    expect(ids.has(website.publisher['@id'])).toBe(true);
    expect(ids.has(website.about['@id'])).toBe(true);
    expect(ids.has(webpage.isPartOf['@id'])).toBe(true);
    expect(webpage.url).toBe(await page.locator('link[rel=canonical]').getAttribute('href'));
  }

  // And the card is a real file of the shape it claims.
  const image = await request.get('/og-image.png');
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/png');
});
