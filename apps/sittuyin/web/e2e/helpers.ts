import type { Page } from '@playwright/test';

export const square = (page: Page, name: string) => page.locator(`[data-square="${name}"]`);
export const handPiece = (page: Page, color: 'w' | 'b', type: string) =>
  page.locator(`[data-hand="${color}"] [data-hand-piece="${type}"]`);

/** Taps a piece in hand and then a square, which is how a placement is made. */
export async function place(page: Page, color: 'w' | 'b', type: string, to: string): Promise<void> {
  await handPiece(page, color, type).click();
  await square(page, to).click();
}

export async function play(page: Page, moves: ReadonlyArray<readonly [string, string]>): Promise<void> {
  for (const [from, to] of moves) {
    await square(page, from).click();
    await square(page, to).click();
  }
}

/**
 * Writes a saved pass-and-play game so the next navigation opens at `fen`. It uses the same
 * localStorage shape the session store persists, which is how a refresh restores a game (play-006).
 */
export async function seedSavedGame(page: Page, fen: string): Promise<void> {
  await page.addInitScript((startFen) => {
    const saved = {
      state: { phase: 'playing', startFen, moves: [], timeControl: null, clock: null, result: null, flipped: false },
      version: 1,
    };
    localStorage.setItem('sittuyin.session.local', JSON.stringify(saved));
  }, fen);
}

/** Starts a pass-and-play game and finishes the setup phase with Auto-arrange. */
export async function startArrangedGame(page: Page): Promise<void> {
  await page.goto('/play/local');
  await page.getByRole('button', { name: 'စတင်ရန်' }).click();
  await page.getByTestId('auto-arrange').click();
  await page.waitForFunction(() => document.querySelectorAll('[data-hand]').length === 0);
}
