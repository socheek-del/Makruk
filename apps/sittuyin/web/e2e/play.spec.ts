import { expect, test } from '@playwright/test';
import { play, seedSavedGame, square, startArrangedGame } from './helpers';

test('moves are played after the setup, and the clock stays off for an untimed game (sit-006)', async ({ page }) => {
  await startArrangedGame(page);
  const banner = page.getByTestId('turn-banner');
  await expect(banner).toHaveText('အဖြူ ၏ အလှည့်');

  // Any legal first move: pick one the engine offers for the piece on the square it highlights.
  const from = 'a3';
  await square(page, from).click();
  const to = (await page.locator('[data-square][data-target]').first().getAttribute('data-square'))!;
  await square(page, to).click();

  await expect(banner).toHaveText('အမည်း ၏ အလှည့်');
  await expect(page.getByTestId('player-b')).toHaveAttribute('data-active', 'true');
});

test('the board draws the two promotion diagonals (sit-005)', async ({ page }) => {
  await startArrangedGame(page);
  const diagonals = page.locator('[data-overlay] [data-diagonals] line');
  await expect(diagonals).toHaveCount(2);
});

test('a Ne on a promotion diagonal promotes in place (sit-006)', async ({ page }) => {
  // A saved game is the shortest honest route to a promotion position: it is the same restore path
  // play-006 already relies on. White's Ne stands on d5, one of White's promotion squares.
  await seedSavedGame(page, '4k3/8/8/3P4/8/1p6/8/4K3 w - - 0 20');
  await page.goto('/play/local');

  await square(page, 'd5').click();
  // Its own square is a promotion target, and the diagonal neighbours are too.
  await expect(square(page, 'd5')).toHaveAttribute('data-promotion', 'true');
  await page.getByTestId('promote-in-place').click();

  // The Ne is now a Sit-ke standing on the square it promoted from.
  await expect(square(page, 'd5').locator('[data-piece]')).toHaveAttribute('data-piece', 'wf~');
  await expect(page.getByTestId('move-list')).toContainText('d5=F');
  await expect(page.getByTestId('turn-banner')).toHaveText('အမည်း ၏ အလှည့်');
});

test('history can be reviewed and returned from', async ({ page }) => {
  await startArrangedGame(page);
  await play(page, [['a3', 'a4']]);
  await page.getByRole('button', { name: 'ယခင် ရွှေ့ကွက်' }).click();
  await expect(page.getByRole('button', { name: 'ပွဲသို့ ပြန်သွားရန်' })).toBeVisible();
  await page.getByRole('button', { name: 'ပွဲသို့ ပြန်သွားရန်' }).click();
  await expect(page.getByRole('button', { name: 'ပွဲသို့ ပြန်သွားရန်' })).toHaveCount(0);
});

test('a finished setup and its moves survive a reload (play-006)', async ({ page }) => {
  await startArrangedGame(page);
  await play(page, [['a3', 'a4']]);
  const before = await page.getByTestId('move-list').textContent();
  await page.reload();
  await expect(page.getByTestId('move-list')).toHaveText(before!);
  await expect(page.getByTestId('turn-banner')).toHaveText('အမည်း ၏ အလှည့်');
});

test('resigning ends the game', async ({ page }) => {
  await startArrangedGame(page);
  await page.getByRole('button', { name: 'အရှုံးပေးရန်' }).click();
  await page.getByTestId('confirm-resign').click();
  await expect(page.getByRole('dialog', { name: 'အမည်း အနိုင်ရသည်' })).toBeVisible();
});
