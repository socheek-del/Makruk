import { expect, test } from '@playwright/test';
import { play, startLocalGame } from './helpers';

const PRESETS = ['1+0', '2+1', '3+0', '3+2', '5+0', '5+3', '10+0', '10+5', '15+10', '30+0', '30+20'];

test('setup lists every preset plus no clock and custom', async ({ page }) => {
  await page.goto('/play/local');
  for (const id of [...PRESETS, 'none', 'custom']) {
    await expect(page.locator(`[data-time-control="${id}"]`)).toBeVisible();
  }
  await page.locator('[data-time-control="custom"]').click();
  await expect(page.getByLabel('นาที', { exact: true })).toBeVisible();
  await expect(page.getByLabel('เพิ่มต่อตา (วินาที)', { exact: true })).toBeVisible();
});

test('clock counts down, applies increment after each move', async ({ page }) => {
  await page.clock.install();
  await startLocalGame(page, { timeControl: '2+1' });
  await expect(page.getByTestId('clock-w')).toHaveText('2:00');
  await expect(page.getByTestId('clock-b')).toHaveText('2:00');

  await page.clock.runFor(3_000);
  await expect(page.getByTestId('clock-w')).toHaveText('1:57');
  await play(page, [['e3', 'e4']]);
  // 2:00 − 3s + 1s increment
  await expect(page.getByTestId('clock-w')).toHaveText('1:58');

  await page.clock.runFor(5_000);
  await expect(page.getByTestId('clock-b')).toHaveText('1:55');
  await expect(page.getByTestId('clock-w')).toHaveText('1:58');
});

test('running out of time loses the game', async ({ page }) => {
  await page.clock.install();
  await startLocalGame(page, { timeControl: '1+0' });
  await page.clock.runFor(61_000);
  const dialog = page.getByRole('dialog', { name: 'ฝ่ายดำชนะ' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('result-reason')).toHaveText('หมดเวลา');
});

test('last used time control is remembered after reload', async ({ page }) => {
  await page.goto('/play/local');
  await page.locator('[data-time-control="5+3"]').click();
  await page.reload();
  await expect(page.locator('[data-time-control="5+3"]')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-time-control="none"]')).toHaveAttribute('aria-checked', 'false');
});
