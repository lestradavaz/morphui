import { expect, test, type Page } from '@playwright/test';
const routes = ['/','/docs/installation','/docs/themes','/docs/motion','/docs/morph-dialog','/docs/morph-window','/docs/morph-card'];

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
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'index, follow');
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
  await expect(page.locator('.preview-stage')).toHaveAttribute('data-morph-mode','dark');
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

test('installation downloads a real tarball and copies the selected command', async ({ page, context, request }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/docs/installation');
  await hydrate(page);
  await page.getByRole('button',{name:'pnpm',exact:true}).click();
  await expect(page.locator('.install-code code')).toHaveText('pnpm add ./morphui-0.0.0.tgz gsap');
  await page.locator('.install-code').getByRole('button',{name:'Copy',exact:true}).click();
  await expect(page.locator('.copy-feedback')).toHaveText('Copied');
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('pnpm add ./morphui-0.0.0.tgz gsap');
  const url = await page.getByRole('link',{name:'Download package'}).getAttribute('href');
  const response = await request.get(url!);
  expect(response.status()).toBe(200);
  const bytes = await response.body();
  expect([...bytes.subarray(0,2)]).toEqual([0x1f,0x8b]);
  expect(bytes.byteLength).toBeGreaterThan(10000);
});

test('the hero carries a copyable install command for every package manager', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.goto('/');
  await hydrate(page);
  // The hero command is the reason a developer lands here, so it has to be the
  // real line and not a decorative one.
  const code = page.locator('.hero-install .install-code code');
  await expect(code).toHaveText('npm install ./morphui-0.0.0.tgz gsap');
  // One package on one registry: every manager installs the same thing, so the
  // hero offers the choice rather than picking one and hiding the rest.
  for (const [manager, expected] of [['pnpm','pnpm add ./morphui-0.0.0.tgz gsap'],['yarn','yarn add ./morphui-0.0.0.tgz gsap'],['bun','bun add ./morphui-0.0.0.tgz gsap']] as const) {
    await page.locator('.hero-install').getByRole('button',{name:manager,exact:true}).click();
    await expect(code).toHaveText(expected);
  }
  await page.locator('.hero-install').getByRole('button',{name:'Copy',exact:true}).click();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('bun add ./morphui-0.0.0.tgz gsap');
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
 * Panel chrome keeps its own shape and its corner.
 *
 * Everything inside the panel carries the panel's non-uniform scale, so a close
 * button in the corner used to render 18 by 12 at the start of a dialog and
 * squash back down on the way out. The engine undoes that scale for the chrome
 * layer; this reads the button while the panel is still moving, which is the
 * only place the regression is visible.
 */
test('the close button holds its size and its corner for the whole flight', async ({ page }) => {
  await page.goto('/docs/morph-card');
  await hydrate(page);
  await page.getByRole('button',{name:'Slow motion',exact:true}).click();

  const read = () => page.locator('.morph-dialog[open] .morph-panel').evaluate(panel => {
    const closer = panel.querySelector('.demo-close')!;
    const p = panel.getBoundingClientRect(), c = closer.getBoundingClientRect();
    let seen = 1;
    for (let el: Element | null = closer; el; el = el.parentElement) seen *= Number(getComputedStyle(el).opacity);
    return { panel: p.width, w: Math.round(c.width), h: Math.round(c.height), top: Math.round(c.y - p.y), right: Math.round(p.x + p.width - c.x - c.width), seen };
  });

  await page.getByRole('button',{name:'Open A study in motion',exact:true}).click();
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(400);
    const at = await read();
    expect(at.w).toBe(38);
    expect(at.h).toBe(38);
    expect(at.top).toBe(18);
    expect(at.right).toBe(18);
  }
  // On by the time the panel has grown into itself, never a growing speck.
  expect((await read()).seen).toBeCloseTo(1, 1);

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
    expect(at.top).toBe(18);
    expect(at.right).toBe(18);
    leaving.push({ panel: at.panel, seen: at.seen });
  }
  // Still there as the panel starts back, and gone before it arrives: the button
  // leaves on its own beat rather than riding the box down to the card's size.
  expect(leaving[0]!.seen).toBeGreaterThan(0.3);
  expect(leaving.some(at => at.seen < 0.05)).toBe(true);
  await expect(page.locator('.morph-dialog[open]')).toHaveCount(0, { timeout: 15_000 });
});
