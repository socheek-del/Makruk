import { expect, test } from '@playwright/test';
import { square } from './helpers';

test('the computer places its own pieces and then replies with legal moves (sit-006)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('button', { name: 'စတင်ရန်' }).click();

  // The human arranges their own side; the bot answers each placement with one of its own.
  await page.getByTestId('auto-arrange').click();
  await expect(page.locator('[data-hand]')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByTestId('turn-banner')).toHaveText('အဖြူ ၏ အလှည့်');

  await square(page, 'a3').click();
  const to = (await page.locator('[data-square][data-target]').first().getAttribute('data-square'))!;
  await square(page, to).click();

  // The bot's reply lands on its own, so the board comes back to White.
  await expect(page.getByTestId('turn-banner')).toHaveText('အဖြူ ၏ အလှည့်', { timeout: 30_000 });
  const plies = await page.locator('[data-ply]').count();
  expect(plies).toBe(18);
});

test('a game against the computer survives a reload (play-006)', async ({ page }) => {
  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('button', { name: 'စတင်ရန်' }).click();
  await page.getByTestId('auto-arrange').click();
  await expect(page.locator('[data-hand]')).toHaveCount(0, { timeout: 30_000 });

  const before = await page.getByTestId('move-list').textContent();
  await page.reload();
  await expect(page.getByTestId('move-list')).toHaveText(before!);
});
