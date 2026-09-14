import { expect, type Page, test } from '@playwright/test';
import { pieceOn, play, square, startLocalGame } from './helpers';

async function drag(page: Page, from: string, to: string) {
  const a = await square(page, from).boundingBox();
  const b = await square(page, to).boundingBox();
  if (!a || !b) throw new Error('square not visible');
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 8, a.y + a.height / 2 + 8, { steps: 3 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
}

const boardPieces = (page: Page) => page.locator('[data-square] [data-piece]');

test.beforeEach(async ({ page }) => {
  await startLocalGame(page);
  await expect(boardPieces(page)).toHaveCount(32);
});

test('tap a Bia shows its legal destination, tap the destination moves it', async ({ page }) => {
  await square(page, 'e3').click();
  await expect(square(page, 'e3')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-target]')).toHaveCount(1);
  await expect(square(page, 'e4')).toHaveAttribute('data-target', 'true');

  await square(page, 'e4').click();
  await expect(pieceOn(page, 'e4')).toHaveAttribute('data-piece', 'wp');
  await expect(pieceOn(page, 'e3')).toHaveCount(0);
  await expect(page.locator('[data-target]')).toHaveCount(0);
  await expect(square(page, 'e3')).toHaveAttribute('data-last-move', 'true');
  await expect(square(page, 'e4')).toHaveAttribute('data-last-move', 'true');
});

test('tapping an illegal destination does not move the piece', async ({ page }) => {
  await square(page, 'e3').click();
  await square(page, 'e5').click();
  await expect(pieceOn(page, 'e3')).toHaveAttribute('data-piece', 'wp');
  await expect(pieceOn(page, 'e5')).toHaveCount(0);
});

test('dragging a Ma to a legal square moves it', async ({ page }) => {
  await drag(page, 'b1', 'd2');
  await expect(pieceOn(page, 'd2')).toHaveAttribute('data-piece', 'wn');
  await expect(pieceOn(page, 'b1')).toHaveCount(0);
});

test('dragging to an illegal square snaps the piece back', async ({ page }) => {
  await drag(page, 'g1', 'g4');
  await expect(pieceOn(page, 'g1')).toHaveAttribute('data-piece', 'wn');
  await expect(pieceOn(page, 'g4')).toHaveCount(0);
  await expect(boardPieces(page)).toHaveCount(32);
});

test('check is highlighted on the Khun', async ({ page }) => {
  // White Ruea swings to the e-file and captures on e6, checking the Black Khun on e8.
  await play(page, [
    ['a3', 'a4'], ['h6', 'h5'], ['a4', 'a5'], ['h5', 'h4'], ['a1', 'a4'], ['h8', 'h5'], ['a4', 'e4'], ['h5', 'h6'],
    ['e4', 'e5'], ['d6', 'd5'], ['e5', 'e6'],
  ]);
  await expect(square(page, 'e8')).toHaveAttribute('data-check', 'true');
  await expect(page.getByTestId('turn-banner')).toContainText('รุก!');
});
