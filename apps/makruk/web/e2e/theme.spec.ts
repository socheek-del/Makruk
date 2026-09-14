import { expect, test } from '@playwright/test';
import { square, startLocalGame } from './helpers';

const bodyBackground = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('colour mode switches between light and dark and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/settings');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');
  expect(await bodyBackground(page)).toBe('rgb(248, 244, 236)');

  await page.getByRole('radio', { name: 'มืด', exact: true }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  expect(await bodyBackground(page)).toBe('rgb(18, 18, 38)');
  await page.screenshot({ path: 'e2e-evidence/settings-dark.png', fullPage: true });

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('radio', { name: 'มืด', exact: true })).toHaveAttribute('aria-checked', 'true');

  await page.getByRole('radio', { name: 'สว่าง', exact: true }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
});

test('system colour mode follows the operating system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/settings');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(html).toHaveAttribute('data-theme', 'light');
});

test('board theme changes the board and persists', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.locator('[data-board-theme]')).toHaveCount(6);
  await page.locator('[data-board-theme="jade"]').click();
  await expect(page.locator('[data-board-theme="jade"]')).toHaveAttribute('aria-checked', 'true');

  await startLocalGame(page);
  await expect(square(page, 'a4')).toHaveCSS('background-color', 'rgb(168, 216, 185)');

  await page.goto('/settings');
  await page.locator('[data-board-theme="lacquer"]').click();
  await page.reload();
  await expect(page.locator('[data-board-theme="lacquer"]')).toHaveAttribute('aria-checked', 'true');
  await startLocalGame(page);
  await expect(square(page, 'a4')).toHaveCSS('background-color', 'rgb(74, 31, 26)');
  await page.screenshot({ path: 'e2e-evidence/board-lacquer.png' });
});

test('coordinates can be hidden', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('switch', { name: 'แสดงพิกัดบนกระดาน' }).click();
  await startLocalGame(page);
  await expect(square(page, 'a2')).toHaveText('');
  await expect(square(page, 'b1').locator('span', { hasText: 'b' })).toHaveCount(0);
});
