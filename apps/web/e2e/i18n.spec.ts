import { expect, test } from '@playwright/test';

test('opens in Thai by default; English choice applies immediately and persists', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('lang', 'th');
  await expect(page.getByRole('heading', { name: 'เลือกวิธีเล่น' })).toBeVisible();

  await page.getByRole('link', { name: 'ตั้งค่า' }).click();
  await expect(page.getByRole('heading', { name: 'ตั้งค่า', level: 1 })).toBeVisible();

  await page.getByRole('radio', { name: 'English' }).click();
  await expect(html).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Play' })).toBeVisible();

  await page.reload();
  await expect(html).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');

  await page.getByRole('link', { name: 'Play' }).click();
  await expect(page.getByRole('heading', { name: 'Choose how to play' })).toBeVisible();

  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'ไทย' }).click();
  await expect(html).toHaveAttribute('lang', 'th');
});
