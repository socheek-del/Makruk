import { expect, type Page, test } from '@playwright/test';
import { play, square } from './helpers';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function completeBoardLesson(page: Page) {
  await page.locator('[data-lesson="board"] a').click();
  await button(page, 'ต่อไป').click();
  await button(page, 'ต่อไป').click();
  await square(page, 'd1').click();
  await button(page, 'ตรวจคำตอบ').click();
  await button(page, 'ต่อไป').click();
  await square(page, 'e1').click();
  await button(page, 'ตรวจคำตอบ').click();
  await button(page, 'ต่อไป').click();
  await page.locator('[data-choice="1"]').click();
  await button(page, 'ตรวจคำตอบ').click();
  await button(page, 'ต่อไป').click();
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
  await button(page, 'ต่อไป').click();
}

async function completeKhunLesson(page: Page) {
  await page.locator('[data-lesson="khun"] a').click();
  await button(page, 'ต่อไป').click();
  for (const sq of ['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5']) await square(page, sq).click();
  await button(page, 'ตรวจคำตอบ').click();
  await button(page, 'ต่อไป').click();
  await square(page, 'd3').click();
  await square(page, 'e4').click();
  await button(page, 'ต่อไป').click();
  await square(page, 'd1').click();
  await square(page, 'd2').click();
  await button(page, 'ต่อไป').click();
  await page.locator('[data-choice="1"]').click();
  await button(page, 'ตรวจคำตอบ').click();
  await button(page, 'ต่อไป').click();
  await expect(page.getByTestId('lesson-complete')).toBeVisible();
  await button(page, 'ต่อไป').click();
}

test('every lesson is open from the start; finishing one marks it and adds XP; no streak (learn-005)', async ({ page }) => {
  await page.goto('/learn');
  await expect(page.getByTestId('xp')).toHaveText('0 XP');
  await expect(page.getByTestId('streak')).toHaveCount(0);
  await expect(page.locator('[data-lesson]')).toHaveCount(12);
  await expect(page.locator('[data-lesson] a')).toHaveCount(12);
  await expect(page.locator('[data-status="locked"]')).toHaveCount(0);
  // Unit banners are coloured so their white titles are readable.
  const banners = page.getByTestId('unit-banner');
  await expect(banners).toHaveCount(3);
  for (const background of await banners.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))) {
    expect(background).not.toBe('rgb(255, 255, 255)');
  }
  await page.screenshot({ path: 'e2e-evidence/learn-path.png', fullPage: true });

  // Skip ahead: the Khun lesson is playable without finishing the board lesson first.
  await completeKhunLesson(page);
  await expect(page.getByTestId('xp')).toHaveText('10 XP');
  await expect(page.locator('[data-lesson="khun"]')).toHaveAttribute('data-status', 'completed');
  await expect(page.locator('[data-lesson="board"]')).toHaveAttribute('data-status', 'unlocked');

  await page.reload();
  await completeBoardLesson(page);
  await expect(page.getByTestId('xp')).toHaveText('20 XP');
  await expect(page.locator('[data-lesson="board"]')).toHaveAttribute('data-status', 'completed');
});

test('guided first game shows coach tips and completing it finishes the lesson (learn-004)', async ({ page }) => {
  await page.goto('/play/guided');
  const tip = page.getByTestId('coach-tip');
  await expect(tip).toHaveAttribute('data-tip', 'firstMove');
  await expect(tip).toContainText('โค้ชขุนน้อย');

  await play(page, [['e3', 'e4']]);
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(2, { timeout: 15_000 });
  await expect(tip).not.toHaveAttribute('data-tip', 'firstMove');
  await page.screenshot({ path: 'e2e-evidence/guided-game.png' });

  await page.getByRole('button', { name: 'ยอมแพ้' }).click();
  await page.getByRole('dialog', { name: 'ฝ่ายขาวยอมแพ้?' }).getByRole('button', { name: 'ยอมแพ้' }).click();
  await expect(page.getByRole('dialog', { name: 'ฝ่ายดำชนะ' })).toBeVisible();
  await expect(tip).toHaveAttribute('data-tip', 'gameOver');

  await page.goto('/learn');
  await expect(page.locator('[data-lesson="guided"]')).toHaveAttribute('data-status', 'completed');
  await expect(page.getByTestId('xp')).toHaveText('20 XP');
});
