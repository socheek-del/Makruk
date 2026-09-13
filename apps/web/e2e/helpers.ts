import { expect, type Page } from '@playwright/test';

export const square = (page: Page, name: string) => page.locator(`[data-square="${name}"]`);
export const pieceOn = (page: Page, name: string) => square(page, name).locator('[data-piece]');

export interface LocalGameOptions {
  timeControl?: string;
  view?: 'คงที่' | 'หมุนตามตา' | 'นั่งตรงข้าม';
  fen?: string;
}

/** Opens pass-and-play setup, applies options and starts the game. */
export async function startLocalGame(page: Page, options: LocalGameOptions = {}) {
  await page.goto(options.fen ? `/play/local?fen=${encodeURIComponent(options.fen)}` : '/play/local');
  await page.locator(`[data-time-control="${options.timeControl ?? 'none'}"]`).click();
  if (options.view) await page.getByRole('radio', { name: options.view }).click();
  await page.getByRole('button', { name: 'เริ่มเกม' }).click();
  await expect(page.getByRole('grid')).toBeVisible();
}

export async function play(page: Page, moves: Array<[string, string]>) {
  for (const [from, to] of moves) {
    await square(page, from).click();
    await square(page, to).click();
    await expect(pieceOn(page, to)).toBeVisible();
  }
}
