import { expect, type Locator, type Page, test } from '@playwright/test';

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

test('the nav bar gives way to lessons and games on a phone, and the back link brings it back (polish-003)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('nav')).toBeVisible();

  await page.goto('/learn/khun');
  await expect(page.getByTestId('lesson-player')).toBeVisible();
  await expect(page.locator('nav')).toBeHidden();
  const header = page.getByTestId('lesson-header');
  await inViewport(page, header, 'progress header');
  expect((await header.boundingBox())!.y).toBeLessThanOrEqual(8);
  await inViewport(page, page.getByTestId('lesson-prompt'), 'prompt');
  await inViewport(page, page.getByRole('button', { name: 'ต่อไป', exact: true }), 'continue');
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);

  await page.goto('/play/local');
  await page.getByRole('button', { name: 'เริ่มเกม' }).click();
  await expect(page.locator('nav')).toBeHidden();
  for (const [name, locator] of [
    ['top player', page.getByTestId('player-b')],
    ['board', page.getByRole('grid')],
    ['bottom player', page.getByTestId('player-w')],
    ['turn banner', page.getByTestId('turn-banner')],
  ] as const) {
    await inViewport(page, locator, name);
  }

  await page.getByTestId('focus-back').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('nav')).toBeVisible();
});
