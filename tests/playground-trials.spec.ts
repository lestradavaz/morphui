import { expect, test } from '@playwright/test';

test('component trials respond to pointer and keyboard input', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.trial')).toHaveCount(15);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);

  const button = page.locator('#button');
  await button.getByRole('button', { name: 'Click to load' }).click();
  await expect(button.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await button.getByRole('button', { name: 'Cancel' }).click();

  const toggle = page.locator('#switch').getByRole('switch', { name: 'Notifications' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');

  const checkbox = page.locator('#checkbox').getByRole('checkbox', { name: 'Toggle me' });
  await page.locator('#checkbox').getByText('Toggle me').click();
  await expect(checkbox).toBeChecked();

  const tabs = page.locator('#tabs');
  await tabs.getByRole('tab', { name: 'Overview' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.getByRole('tab', { name: 'Features' })).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.getByRole('tabpanel')).toContainText('semantic color tokens');

  const radio = page.locator('#radio').getByRole('radiogroup').first();
  await radio.getByText('Large').click();
  await expect(radio.getByRole('radio', { name: 'Large' })).toBeChecked();

  const stepper = page.locator('#stepper');
  await stepper.getByRole('button', { name: 'Increase' }).click();
  await expect(stepper.locator('.morph-stepper-display')).toContainText('2');
  await stepper.getByRole('button', { name: 'Decrease' }).click();
  await stepper.getByRole('button', { name: 'Decrease' }).click();
  await expect(stepper.getByRole('button', { name: 'Decrease' })).toBeHidden();

  const input = page.locator('#input');
  await input.getByRole('textbox', { name: 'Email address' }).fill('invalid');
  await expect(input.getByText('Enter a valid email address.')).toBeVisible();
  await input.getByRole('textbox', { name: 'Email address' }).fill('name@example.com');
  await expect(input.getByText('Address looks good.')).toBeVisible();

  const cta = page.locator('#cta');
  await cta.getByRole('button', { name: 'Save changes' }).click();
  await expect(cta.getByRole('button', { name: 'Saved' })).toBeVisible();
  await page.waitForTimeout(300);
  const hold = cta.getByRole('button', { name: 'Hold to confirm' });
  await hold.scrollIntoViewIfNeeded();
  const bounds = await hold.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(750);
  await page.mouse.up();
  await expect(cta.getByRole('button', { name: 'Confirmed' })).toBeVisible();

  const select = page.locator('#select');
  await select.getByRole('button', { name: /Choose a finish/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Choose a finish' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Teal' }).click();
  await expect(dialog).toBeHidden();
  await expect(select.getByRole('button', { name: /Choose a finish/ })).toContainText('Teal');

  const expand = page.locator('#expand');
  await expand.getByRole('button', { name: 'Share' }).click();
  await expect(expand.getByRole('button', { name: 'Copy link' })).toBeVisible();
  await expand.getByRole('button', { name: 'Send email' }).click();
  await expect(expand.getByRole('button', { name: 'Send email' })).toHaveAttribute('aria-expanded', 'false');
});

test('dialog and expandable control close with Escape', async ({ page }) => {
  await page.goto('/');
  await page.locator('#select').getByRole('button', { name: /Choose a finish/ }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Choose a finish' })).toBeHidden();

  const expand = page.locator('#expand');
  await expand.getByRole('button', { name: 'Share' }).click();
  await expand.getByRole('button', { name: 'Copy link' }).focus();
  await page.keyboard.press('Escape');
  await expect(expand.getByRole('button', { name: 'Share' })).toHaveAttribute('aria-expanded', 'false');
});

test('selection and morph surfaces keep their geometry', async ({ page }) => {
  await page.goto('/');

  const radio = page.locator('#radio .morph-radio').first();
  const indicator = radio.locator('.morph-radio-indicator');
  const selected = radio.locator('.morph-radio-option:has(input:checked)');
  const aligned = async () => {
    const background = await indicator.boundingBox();
    const option = await selected.boundingBox();
    expect(background).not.toBeNull();
    expect(option).not.toBeNull();
    expect(Math.abs(background!.y - option!.y)).toBeLessThan(1);
    expect(Math.abs(background!.height - option!.height)).toBeLessThan(1);
  };
  await aligned();
  await radio.getByText('Large').click();
  await page.waitForTimeout(250);
  await aligned();

  const stepper = page.locator('#stepper .morph-stepper');
  const footprint = await stepper.boundingBox();
  await stepper.getByRole('button', { name: 'Decrease' }).click();
  await expect(stepper.getByRole('button', { name: 'Decrease' })).toBeHidden();
  await page.waitForTimeout(500);
  expect((await stepper.boundingBox())!.width).toBe(footprint!.width);
  expect((await stepper.locator('.morph-stepper-display').boundingBox())!.width).toBeGreaterThan(140);

  const save = page.locator('#cta .cta-arrow');
  await save.evaluate((node) => { (node as HTMLElement).dataset.identity = 'preserved'; });
  await save.click();
  await page.waitForTimeout(120);
  await expect(save).toHaveAttribute('data-identity', 'preserved');
  expect(await save.boundingBox()).toMatchObject({ height: 48 });

  const expand = page.locator('#expand .morph-expand');
  const closedWidth = (await expand.boundingBox())!.width;
  expect(closedWidth).toBeLessThan(126);
  const shareIcon = await expand.locator('.morph-expand-icon').boundingBox();
  const shareLabel = await expand.locator('.morph-expand-label').boundingBox();
  const shareSurface = await expand.boundingBox();
  expect(shareSurface!.x + shareSurface!.width - shareLabel!.x - shareLabel!.width).toBeGreaterThan(shareIcon!.x - shareSurface!.x);
  await expand.locator('.morph-expand-trigger').click();
  await page.waitForTimeout(550);
  expect((await expand.boundingBox())!.width).toBeGreaterThan(closedWidth + 100);
  await expand.getByRole('button', { name: 'Send email' }).click();
  await page.waitForTimeout(450);
  const collapsed = await expand.boundingBox();
  const icon = await expand.locator('.morph-expand-icon').boundingBox();
  const label = await expand.locator('.morph-expand-label').boundingBox();
  expect(collapsed!.width).toBeGreaterThan(closedWidth);
  expect(collapsed!.x + collapsed!.width - label!.x - label!.width).toBeGreaterThan(icon!.x - collapsed!.x);
});

test('form overlays support search, selection, focus and dismissal', async ({ page }) => {
  await page.goto('/');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const combobox = page.locator('#combobox').getByRole('combobox', { name: 'Search workspaces' });
  await combobox.click();
  await combobox.fill('archive');
  await expect(page.getByRole('option', { name: /Component archive/ })).toBeVisible();
  const panel = await page.locator('.morph-combobox-panel').boundingBox();
  expect(panel).not.toBeNull();
  expect(panel!.x).toBeGreaterThanOrEqual(0);
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(panel!.y).toBeGreaterThanOrEqual(0);
  expect(panel!.y + panel!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await combobox.press('Enter');
  await expect(combobox).toHaveValue('Component archive');
  await expect(combobox).toHaveAttribute('aria-expanded', 'false');
  await combobox.click();
  await expect(combobox).toHaveAttribute('aria-expanded', 'true');
  await combobox.press('Escape');

  const multi = page.locator('#multi-select');
  await multi.getByRole('button', { name: 'Choose topics' }).click();
  await page.getByRole('combobox', { name: 'Search topics' }).fill('Type');
  await page.getByRole('option', { name: 'TypeScript' }).click();
  await expect(multi.getByRole('button', { name: 'Remove TypeScript' })).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();
  await multi.getByRole('button', { name: 'Remove TypeScript' }).click();
  await expect(multi.getByRole('button', { name: 'Remove TypeScript' })).toHaveCount(0);

  const tooltip = page.locator('#tooltip');
  await tooltip.getByRole('button', { name: 'Keyboard focus' }).focus();
  await expect(tooltip.getByRole('tooltip')).toHaveAttribute('data-open', 'true');
  await page.keyboard.press('Escape');
  await expect(tooltip.getByRole('tooltip', { includeHidden: true }).last()).toHaveAttribute('data-open', 'false');

  const popover = page.locator('#popover');
  await popover.getByRole('button', { name: /Notification settings/ }).click();
  const settings = page.getByRole('dialog', { name: 'Notification settings' });
  await expect(settings).toBeVisible();
  await settings.getByRole('switch', { name: 'Sounds' }).click();
  await expect(settings.getByRole('switch', { name: 'Sounds' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
  await expect(settings).toBeHidden();
  expect(errors).toEqual([]);
});

test('context menu opens at pointer and keyboard origin', async ({ page }) => {
  await page.goto('/');
  const target = page.locator('#context-menu').getByRole('button', { name: /Actions for Project brief/ });
  await target.click({ button: 'right' });
  const menu = page.getByRole('menu', { name: 'File actions' });
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Duplicate' }).click();
  await expect(page.locator('#context-menu')).toContainText('1 copy');
  await target.focus();
  await page.keyboard.press('Shift+F10');
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitemcheckbox', { name: 'Favorite' }).click();
  await expect(menu.getByRole('menuitemcheckbox', { name: 'Favorite' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await target.click();
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
});

test('new anchored controls remain usable with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const popover = page.locator('#popover').getByRole('button', { name: /Notification settings/ });
  await popover.click();
  await expect(page.getByRole('dialog', { name: 'Notification settings' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Notification settings' })).toBeHidden();
  const target = page.locator('#context-menu').getByRole('button', { name: /Actions for Project brief/ });
  await target.click();
  await expect(page.getByRole('menu', { name: 'File actions' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu', { name: 'File actions' })).toBeHidden();
});
