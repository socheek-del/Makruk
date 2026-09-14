import { expect, type Page, test } from '@playwright/test';
import { play, square, startLocalGame } from './helpers';

const soundLog = (page: Page) =>
  page.evaluate(() => (window as unknown as { __makrukSoundLog?: string[] }).__makrukSoundLog ?? []);

test('moves play sounds; muting persists after reload (polish-003)', async ({ page }) => {
  await startLocalGame(page);
  await play(page, [['e3', 'e4'], ['d6', 'd5'], ['e4', 'd5']]);
  expect(await soundLog(page)).toEqual(['move', 'move', 'capture']);

  await page.goto('/settings');
  const sound = page.getByRole('switch', { name: 'เสียงประกอบ' });
  await expect(sound).toHaveAttribute('aria-checked', 'true');
  await sound.click();
  await expect(sound).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await expect(sound).toHaveAttribute('aria-checked', 'false');
  const haptics = page.getByRole('switch', { name: 'สั่นเมื่อเดินหมาก' });
  await haptics.click();
  await page.reload();
  await expect(haptics).toHaveAttribute('aria-checked', 'false');

  await startLocalGame(page);
  await play(page, [['e3', 'e4']]);
  expect(await soundLog(page)).toEqual([]);
});

test('a tapped move slides into place (polish-003)', async ({ page }) => {
  await startLocalGame(page);
  await square(page, 'b1').click();
  await square(page, 'd2').click();
  const moved = page.locator('[data-square="d2"] [data-animating]');
  await expect(moved).toHaveCount(1);
  expect(await moved.evaluate((el) => getComputedStyle(el).animationName)).toBe('piece-slide');
});

test('reduced-motion users get no sliding animation (polish-003)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await startLocalGame(page);
  await square(page, 'b1').click();
  await square(page, 'd2').click();
  await expect(page.locator('[data-square="d2"] [data-piece]')).toHaveAttribute('data-piece', 'wn');
  await expect(page.locator('[data-animating]')).toHaveCount(0);
});

test('lesson answers play correct and wrong sounds (polish-003)', async ({ page }) => {
  await page.goto('/learn/met');
  await page.getByRole('button', { name: 'ต่อไป', exact: true }).click();
  await square(page, 'c3').click();
  await page.getByRole('button', { name: 'ตรวจคำตอบ', exact: true }).click();
  await page.getByRole('button', { name: 'ลองอีกครั้ง', exact: true }).click();
  for (const sq of ['c3', 'c5', 'e3', 'e5']) await square(page, sq).click();
  await page.getByRole('button', { name: 'ตรวจคำตอบ', exact: true }).click();
  expect(await soundLog(page)).toEqual(['wrong', 'correct']);
});
