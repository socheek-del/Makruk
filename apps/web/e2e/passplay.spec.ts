import { expect, test } from '@playwright/test';
import { play, startLocalGame } from './helpers';

test('turn banner follows the side to move', async ({ page }) => {
  await startLocalGame(page);
  const banner = page.getByTestId('turn-banner');
  await expect(banner).toHaveText('ตาเดินของฝ่ายขาว');
  await play(page, [['e3', 'e4']]);
  await expect(banner).toHaveText('ตาเดินของฝ่ายดำ');
  await expect(page.getByTestId('player-b')).toHaveAttribute('data-active', 'true');
});

test('a mating move ends the game with a winner screen', async ({ page }) => {
  await startLocalGame(page, { fen: 'k7/2R5/8/8/8/8/8/4K2R w - - 0 1' });
  await play(page, [['h1', 'h8']]);
  const dialog = page.getByRole('dialog', { name: 'ฝ่ายขาวชนะ' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('result-reason')).toHaveText('รุกจน');
  await page.screenshot({ path: 'e2e-evidence/game-over.png' });

  await dialog.getByRole('button', { name: 'ดูกระดาน' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('turn-banner')).toHaveText('ฝ่ายขาวชนะ');
});

test('resigning ends the game for the side to move', async ({ page }) => {
  await startLocalGame(page);
  await page.getByRole('button', { name: 'ยอมแพ้' }).click();
  await page.getByRole('dialog', { name: 'ฝ่ายขาวยอมแพ้?' }).getByRole('button', { name: 'ยอมแพ้' }).click();
  await expect(page.getByRole('dialog', { name: 'ฝ่ายดำชนะ' })).toBeVisible();
});

test('rotate view flips the board after each move', async ({ page }) => {
  await startLocalGame(page, { view: 'หมุนตามตา' });
  const grid = page.getByRole('grid');
  await expect(grid).toHaveAttribute('data-orientation', 'w');
  await play(page, [['e3', 'e4']]);
  await expect(grid).toHaveAttribute('data-orientation', 'b');
  await play(page, [['d6', 'd5']]);
  await expect(grid).toHaveAttribute('data-orientation', 'w');
});

test('tabletop view turns the far player bar upside down and keeps the board fixed', async ({ page }) => {
  await startLocalGame(page, { view: 'นั่งตรงข้าม' });
  await expect(page.getByTestId('player-b')).toHaveAttribute('data-rotated', 'true');
  await expect(page.getByTestId('player-w')).not.toHaveAttribute('data-rotated', 'true');
  await play(page, [['e3', 'e4']]);
  await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
});

test('flip button turns the board around', async ({ page }) => {
  await startLocalGame(page);
  await page.getByRole('button', { name: 'พลิกกระดาน' }).click();
  await expect(page.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
});
