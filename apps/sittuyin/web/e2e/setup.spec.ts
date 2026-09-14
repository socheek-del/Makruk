import { expect, test } from '@playwright/test';
import { handPiece, square } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/play/local');
  await page.getByRole('button', { name: 'စတင်ရန်' }).click();
});

test('the game opens in the setup phase with both hands and no clock running (sit-006)', async ({ page }) => {
  await expect(page.getByTestId('turn-banner')).toHaveText('အဖြူ အမဲချရန် အလှည့်');
  await expect(page.locator('[data-hand]')).toHaveCount(2);
  // Clocks do not run during setup, so no timer is shown for an untimed game either.
  await expect(page.getByRole('timer')).toHaveCount(0);
});

test('a piece is placed by tapping it in hand and then a legal square', async ({ page }) => {
  const king = handPiece(page, 'w', 'k');
  await expect(king).toBeEnabled();
  await king.click();
  // Selecting from hand marks the squares it may be placed on.
  const targets = page.locator('[data-square][data-target]');
  await expect(targets.first()).toBeVisible();
  const to = (await targets.first().getAttribute('data-square'))!;
  await square(page, to).click();

  await expect(page.getByTestId('move-list')).toContainText(`K@${to}`);
  await expect(page.getByTestId('turn-banner')).toHaveText('အမည်း အမဲချရန် အလှည့်');
});

test('an illegal placement square is refused', async ({ page }) => {
  await handPiece(page, 'w', 'k').click();
  // Rank 8 is the far side of the board: White may never place there.
  await square(page, 'a8').click();
  await expect(page.getByTestId('move-list')).toHaveCount(0);
  await expect(page.getByTestId('turn-banner')).toHaveText('အဖြူ အမဲချရန် အလှည့်');
});

test('a Yahhta may only go on the back rank', async ({ page }) => {
  await handPiece(page, 'w', 'r').click();
  const allowed = await page.locator('[data-square][data-target]').evaluateAll((cells) =>
    cells.map((c) => (c as HTMLElement).dataset.square!),
  );
  expect(allowed.length).toBeGreaterThan(0);
  expect(allowed.every((name) => name.endsWith('1'))).toBe(true);
});

test('a piece can be dragged from the hand onto the board', async ({ page }) => {
  const sin = handPiece(page, 'w', 's');
  await sin.click();
  const to = (await page.locator('[data-square][data-target]').first().getAttribute('data-square'))!;

  const from = (await sin.boundingBox())!;
  const target = (await square(page, to).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  // Past the drag threshold in steps, so the tray sees a drag rather than a tap.
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 });
  await page.mouse.up();

  await expect(page.getByTestId('move-list')).toContainText(`S@${to}`);
});

test('Auto-arrange finishes the setup for both sides and starts play', async ({ page }) => {
  await page.getByTestId('auto-arrange').click();
  await expect(page.locator('[data-hand]')).toHaveCount(0);
  await expect(page.getByTestId('turn-banner')).toHaveText('အဖြူ ၏ အလှည့်');
  // 16 placements were made, 8 per side.
  const plies = await page.locator('[data-ply]').count();
  expect(plies).toBe(16);
});

test('a half-finished setup survives a reload (play-006)', async ({ page }) => {
  await handPiece(page, 'w', 'k').click();
  const to = (await page.locator('[data-square][data-target]').first().getAttribute('data-square'))!;
  await square(page, to).click();
  const before = await page.getByTestId('move-list').textContent();
  await page.reload();
  await expect(page.getByTestId('move-list')).toHaveText(before!);
  await expect(page.locator('[data-hand]')).toHaveCount(2);
});
