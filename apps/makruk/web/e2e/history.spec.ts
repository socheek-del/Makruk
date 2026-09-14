import { expect, test } from '@playwright/test';
import { pieceOn, play, square, startLocalGame } from './helpers';

const SIX_MOVES: Array<[string, string]> = [
  ['e3', 'e4'], ['d6', 'd5'], ['e4', 'd5'], ['g8', 'e7'], ['b1', 'd2'], ['e7', 'd5'],
];

test.beforeEach(async ({ page }) => {
  await startLocalGame(page);
  await play(page, SIX_MOVES);
});

test('move list shows every move in notation', async ({ page }) => {
  const list = page.getByTestId('move-list');
  await expect(list.locator('[data-ply]')).toHaveCount(6);
  await expect(list.locator('[data-ply]')).toHaveText(['e4', 'd5', 'exd5', 'Ne7', 'Nd2', 'Nxd5']);
  await expect(list.locator('[data-ply="6"]')).toHaveAttribute('aria-current', 'true');
});

test('stepping back and forward shows earlier positions and returns to the live game', async ({ page }) => {
  await page.getByRole('button', { name: 'ย้อนกลับ' }).click();
  await page.getByRole('button', { name: 'ย้อนกลับ' }).click();
  // After ply 4: White Bia on d5, Black Ma on e7, White Ma still on b1.
  await expect(pieceOn(page, 'd5')).toHaveAttribute('data-piece', 'wp');
  await expect(pieceOn(page, 'e7')).toHaveAttribute('data-piece', 'bn');
  await expect(pieceOn(page, 'b1')).toHaveAttribute('data-piece', 'wn');
  await expect(page.getByTestId('move-list').locator('[data-ply="4"]')).toHaveAttribute('aria-current', 'true');

  // Input is disabled while reviewing.
  await square(page, 'h3').click();
  await square(page, 'h4').click();
  await expect(pieceOn(page, 'h4')).toHaveCount(0);

  await page.getByRole('button', { name: 'ถัดไป' }).click();
  await page.getByRole('button', { name: 'ถัดไป' }).click();
  await expect(pieceOn(page, 'd5')).toHaveAttribute('data-piece', 'bn');
  await expect(pieceOn(page, 'd2')).toHaveAttribute('data-piece', 'wn');
  await expect(page.getByRole('button', { name: 'กลับสู่เกมปัจจุบัน' })).toHaveCount(0);
});

test('clicking a move in the list jumps to it; first and latest buttons work', async ({ page }) => {
  await page.getByTestId('move-list').locator('[data-ply="2"]').click();
  await expect(pieceOn(page, 'e4')).toHaveAttribute('data-piece', 'wp');
  await expect(pieceOn(page, 'd5')).toHaveAttribute('data-piece', 'bp');

  await page.getByRole('button', { name: 'ไปตาแรก' }).click();
  await expect(pieceOn(page, 'e3')).toHaveAttribute('data-piece', 'wp');
  await expect(page.locator('[data-square] [data-piece]')).toHaveCount(32);

  await page.getByRole('button', { name: 'ตาล่าสุด' }).click();
  await expect(pieceOn(page, 'd5')).toHaveAttribute('data-piece', 'bn');
});

test('undo removes the last move', async ({ page }) => {
  await page.getByRole('button', { name: 'ถอนตา' }).click();
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(5);
  await expect(pieceOn(page, 'd5')).toHaveAttribute('data-piece', 'wp');
  await expect(pieceOn(page, 'e7')).toHaveAttribute('data-piece', 'bn');
  await expect(page.getByTestId('turn-banner')).toHaveText('ตาเดินของฝ่ายดำ');
});
