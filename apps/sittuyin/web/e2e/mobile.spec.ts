import { expect, type Locator, type Page, test } from '@playwright/test';
import { place } from './helpers';

// A phone browser with its address and tool bars showing (polish-003).
test.use({ viewport: { width: 390, height: 664 }, hasTouch: true });

async function inViewport(page: Page, locator: Locator, name: string) {
  await expect(locator, name).toBeVisible();
  const box = (await locator.boundingBox())!;
  const { width, height } = page.viewportSize()!;
  expect(box.y, `${name} top`).toBeGreaterThanOrEqual(-1);
  expect(box.y + box.height, `${name} bottom`).toBeLessThanOrEqual(height + 1);
  expect(box.x + box.width, `${name} right`).toBeLessThanOrEqual(width + 1);
}

const noPageScroll = (page: Page) =>
  expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('the nav bar shows on ordinary pages and gives way to games and lessons (polish-003)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('nav')).toBeVisible();

  await page.goto('/learn/setup');
  await expect(page.getByTestId('lesson-player')).toBeVisible();
  await expect(page.locator('nav')).toBeHidden();

  await page.goto('/play/local');
  await expect(page.locator('nav')).toBeVisible();
  await button(page, 'စတင်ရန်').click();
  await expect(page.getByRole('grid')).toBeVisible();
  await expect(page.locator('nav')).toBeHidden();

  // The back link replaces the nav bar, and the game is still there when the player returns.
  await page.getByTestId('focus-back').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('nav')).toBeVisible();
  await page.goto('/play/local');
  await expect(page.getByTestId('turn-banner')).toBeVisible();
});

test('a lesson fits the screen: progress on top, then the prompt, board and action, with no page scroll', async ({ page }) => {
  await page.goto('/learn/setup');
  const header = page.getByTestId('lesson-header');
  await inViewport(page, header, 'progress header');
  expect((await header.boundingBox())!.y).toBeLessThanOrEqual(8);
  await inViewport(page, page.getByTestId('lesson-prompt'), 'prompt');
  await inViewport(page, page.getByRole('grid'), 'board');
  await inViewport(page, button(page, 'ဆက်လုပ်ရန်'), 'continue');
  await noPageScroll(page);

  await button(page, 'ဆက်လုပ်ရန်').click();
  await button(page, 'ဆက်လုပ်ရန်').click();
  // The placement step adds a hand tray; everything still fits.
  await inViewport(page, page.locator('[data-hand="w"]'), 'hand tray');
  await inViewport(page, page.getByRole('grid'), 'board with tray');
  await place(page, 'w', 'r', 'd1');
  await inViewport(page, page.getByTestId('feedback'), 'feedback');
  await inViewport(page, button(page, 'ဆက်လုပ်ရန်'), 'continue after feedback');
  await noPageScroll(page);

  await button(page, 'ဆက်လုပ်ရန်').click();
  await inViewport(page, page.locator('[data-choice="1"]'), 'last quiz choice');
  await inViewport(page, button(page, 'စစ်ဆေးရန်'), 'check');
  await noPageScroll(page);
});

test('on a very short screen the lesson content scrolls under a pinned progress bar and above a pinned action', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 440 });
  await page.goto('/learn/setup');
  const body = page.getByTestId('lesson-body');
  await expect(body).toBeVisible();
  expect(await body.evaluate((el) => el.scrollHeight > el.clientHeight), 'the step overflows this screen').toBe(true);

  await body.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  await expect(page.getByRole('progressbar')).toBeInViewport();
  expect((await page.getByTestId('lesson-header').boundingBox())!.y).toBeLessThanOrEqual(8);
  await inViewport(page, button(page, 'ဆက်လုပ်ရန်'), 'continue');
  await noPageScroll(page);
});

test('the game screen keeps the board, both players, the turn and Auto-arrange on one screen', async ({ page }) => {
  await page.goto('/play/local');
  await button(page, 'စတင်ရန်').click();
  for (const [name, locator] of [
    ['back link', page.getByTestId('focus-back')],
    ['top player', page.getByTestId('player-b')],
    ['board', page.getByRole('grid')],
    ['bottom player', page.getByTestId('player-w')],
    ['turn banner', page.getByTestId('turn-banner')],
    ['auto-arrange', page.getByTestId('auto-arrange')],
  ] as const) {
    await inViewport(page, locator, name);
  }

  await page.getByTestId('auto-arrange').click();
  await expect(page.locator('[data-hand]')).toHaveCount(0, { timeout: 30_000 });
  for (const [name, locator] of [
    ['top player', page.getByTestId('player-b')],
    ['board', page.getByRole('grid')],
    ['bottom player', page.getByTestId('player-w')],
    ['turn banner', page.getByTestId('turn-banner')],
  ] as const) {
    await inViewport(page, locator, name);
  }
  // Moves and history are below, one scroll away; the board itself never needs one.
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const board = (await page.getByRole('grid').boundingBox())!;
  expect(Math.abs(board.width - board.height)).toBeLessThan(2);
});

test('Burmese text has room for its stacked marks, and long labels grow their buttons instead of spilling out', async ({ page }) => {
  const ratio = (locator: Locator) =>
    locator.evaluate((el) => {
      const style = getComputedStyle(el);
      return parseFloat(style.lineHeight) / parseFloat(style.fontSize);
    });

  await page.goto('/learn/setup');
  expect(await ratio(page.getByTestId('lesson-prompt'))).toBeGreaterThanOrEqual(1.6);

  await page.goto('/');
  expect(await ratio(page.getByRole('heading', { level: 1 }))).toBeGreaterThanOrEqual(1.55);

  await page.goto('/about');
  const buttons = page.getByTestId('contribute').getByRole('link');
  await expect(buttons).toHaveCount(4);
  for (const link of await buttons.all()) {
    const label = (await link.textContent()) ?? '';
    expect(await ratio(link), label).toBeGreaterThanOrEqual(1.6);
    const overflow = await link.evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(overflow, `${label} overflows`).toBeLessThanOrEqual(1);
  }
});
