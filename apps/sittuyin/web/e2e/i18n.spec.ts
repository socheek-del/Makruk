import { expect, test } from '@playwright/test';

test('the site is Burmese by default (sit-006)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'my');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('စစ်တုရင်');
});

test('English is chosen with ?lang=en and remembered after a reload', async ({ page }) => {
  await page.goto('/?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sittuyin');

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sittuyin');
});

test('the language switch in settings changes the whole site', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Settings');

  await page.getByRole('radio', { name: 'မြန်မာ' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'my');
});

test('Burmese text is Unicode, not Zawgyi', async ({ page }) => {
  await page.goto('/');
  const text = (await page.getByRole('heading', { level: 1 }).textContent())!;
  // Unicode encodes စ as U+1005; Zawgyi would reach into the private-use area instead.
  expect(text.codePointAt(0)).toBe(0x1005);
  const body = (await page.locator('body').textContent()) ?? '';
  const privateUse = [...body].filter((c) => c >= '\ue000' && c <= '\uf8ff');
  expect(privateUse).toEqual([]);
});
