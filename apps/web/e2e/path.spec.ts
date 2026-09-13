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

test('path unlocks the next node, XP adds up and the daily streak grows (learn-005)', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-13T10:00:00') });
  await page.goto('/learn');
  await expect(page.getByTestId('xp')).toHaveText('0 XP');
  await expect(page.getByTestId('streak')).toHaveText('0');
  await expect(page.locator('[data-lesson]')).toHaveCount(12);
  await expect(page.locator('[data-status="locked"]')).toHaveCount(11);
  await page.screenshot({ path: 'e2e-evidence/learn-path.png', fullPage: true });

  await completeBoardLesson(page);
  await expect(page.getByTestId('xp')).toHaveText('10 XP');
  await expect(page.getByTestId('streak')).toHaveText('1');
  await expect(page.locator('[data-lesson="board"]')).toHaveAttribute('data-status', 'completed');
  await expect(page.locator('[data-lesson="khun"]')).toHaveAttribute('data-status', 'unlocked');
  await expect(page.locator('[data-lesson="met"]')).toHaveAttribute('data-status', 'locked');

  // Next calendar day: streak continues.
  await page.clock.setSystemTime(new Date('2026-09-14T09:00:00'));
  await page.reload();
  await expect(page.getByTestId('streak')).toHaveText('1');
  await completeKhunLesson(page);
  await expect(page.getByTestId('xp')).toHaveText('20 XP');
  await expect(page.getByTestId('streak')).toHaveText('2');
  await expect(page.locator('[data-lesson="met"]')).toHaveAttribute('data-status', 'unlocked');

  // Two days without a lesson: streak is broken.
  await page.clock.setSystemTime(new Date('2026-09-16T09:00:00'));
  await page.reload();
  await expect(page.getByTestId('streak')).toHaveText('0');
  await expect(page.getByTestId('xp')).toHaveText('20 XP');
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
