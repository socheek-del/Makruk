import { expect, test } from '@playwright/test';

const VARIANTS = ['primary', 'secondary', 'outline', 'danger', 'warning', 'ghost'];

for (const width of [390, 1280]) {
  test(`design showcase renders every component in light and dark at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/design');

    for (const theme of ['light', 'dark'] as const) {
      const panel = page.getByTestId(`showcase-${theme}`);
      await expect(panel).toBeVisible();
      for (const variant of VARIANTS) await expect(panel.getByTestId(`button-${variant}`)).toBeVisible();
      await expect(panel.getByRole('progressbar').first()).toBeVisible();
      await expect(panel.getByRole('switch')).toBeVisible();
      await expect(panel.getByRole('radiogroup')).toBeVisible();
    }

    const canvas = (theme: string) =>
      page.getByTestId(`showcase-${theme}`).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await canvas('light')).toBe('rgb(255, 255, 255)');
    expect(await canvas('dark')).toBe('rgb(19, 31, 36)');

    const fitsWidth = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(fitsWidth).toBe(true);

    await page.screenshot({ path: `test-results/evidence/design-${width}.png`, fullPage: true });
  });
}

test('dialog opens and closes', async ({ page }) => {
  await page.goto('/design');
  const panel = page.getByTestId('showcase-light');
  await panel.getByRole('button', { name: 'เปิดหน้าต่าง' }).click();
  const dialog = page.getByRole('dialog', { name: 'ยินดีด้วย!' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'ปิด' }).click();
  await expect(dialog).toBeHidden();
});
