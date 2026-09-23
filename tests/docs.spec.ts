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
