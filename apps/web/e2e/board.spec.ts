import { expect, test } from '@playwright/test';

const BACK_RANKS: Record<string, string> = {
  a1: 'wr', b1: 'wn', c1: 'ws', d1: 'wk', e1: 'wm', f1: 'ws', g1: 'wn', h1: 'wr',
  a8: 'br', b8: 'bn', c8: 'bs', d8: 'bm', e8: 'bk', f8: 'bs', g8: 'bn', h8: 'br',
};

test('home → pass and play shows the Makruk start position', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /สองคนเครื่องเดียว/ }).click();
  await expect(page).toHaveURL(/\/play\/local$/);

  await expect(page.locator('[data-piece]')).toHaveCount(32);
  for (const [square, code] of Object.entries(BACK_RANKS)) {
    await expect(page.locator(`[data-square="${square}"] [data-piece]`)).toHaveAttribute('data-piece', code);
  }
  for (const file of 'abcdefgh') {
    await expect(page.locator(`[data-square="${file}3"] [data-piece]`)).toHaveAttribute('data-piece', 'wp');
    await expect(page.locator(`[data-square="${file}6"] [data-piece]`)).toHaveAttribute('data-piece', 'bp');
    for (const rank of [2, 4, 5, 7]) await expect(page.locator(`[data-square="${file}${rank}"] [data-piece]`)).toHaveCount(0);
  }
  await expect(page.getByRole('gridcell', { name: 'd1 ขุนขาว' })).toBeVisible();
});

for (const width of [360, 390, 768, 1280]) {
  test(`board is square and fits the screen at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 860 });
    await page.goto('/play/local');
    const box = await page.getByRole('grid').boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.width - box!.height)).toBeLessThan(2);
    expect(box!.x).toBeGreaterThanOrEqual(8);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width - 8);
    expect(box!.width).toBeGreaterThan(Math.min(width - 64, 300));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/evidence/board-${width}.png` });
  });
}
