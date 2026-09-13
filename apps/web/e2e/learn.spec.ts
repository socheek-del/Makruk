import { expect, type Page, test } from '@playwright/test';
import { pieceOn, square } from './helpers';

const prompt = (page: Page) => page.getByTestId('lesson-prompt');
const feedback = (page: Page) => page.getByTestId('feedback');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('lesson engine: info, wrong and right answers, completion saved locally (learn-001)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'เรียน', exact: true }).click();
  await expect(page.locator('[data-lesson="board"]')).toHaveAttribute('data-status', 'unlocked');
  await expect(page.locator('[data-lesson="khun"]')).toHaveAttribute('data-status', 'locked');
  await page.locator('[data-lesson="board"] a').click();

  await expect(prompt(page)).toContainText('นี่คือกระดานหมากรุกไทย');
  await button(page, 'ต่อไป').click();
  await expect(prompt(page)).toContainText('เบี้ยตั้งอยู่แถวที่สาม');
  await button(page, 'ต่อไป').click();

  // Squares step: a wrong answer shows feedback and a hint, retry, then the right answer.
  await expect(prompt(page)).toHaveText('แตะช่องที่ขุนขาวตั้งอยู่');
  await expect(button(page, 'ตรวจคำตอบ')).toBeDisabled();
  await square(page, 'e1').click();
  await button(page, 'ตรวจคำตอบ').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'wrong');
  await expect(feedback(page)).toContainText('ขุนคือหมากที่มีมงกุฎ');
  await button(page, 'ลองอีกครั้ง').click();
  await square(page, 'd1').click();
  await button(page, 'ตรวจคำตอบ').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'ต่อไป').click();

  await square(page, 'e1').click();
  await button(page, 'ตรวจคำตอบ').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'ต่อไป').click();

  await page.locator('[data-choice="1"]').click();
  await button(page, 'ตรวจคำตอบ').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'ต่อไป').click();

  const complete = page.getByTestId('lesson-complete');
  await expect(complete).toBeVisible();
  await expect(complete).toHaveAttribute('data-stars', '2');
  await expect(complete).toContainText('+10 XP');
  await page.screenshot({ path: 'e2e-evidence/lesson-complete.png' });
  await button(page, 'ต่อไป').click();

  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('[data-lesson="board"]')).toHaveAttribute('data-status', 'completed');
  await expect(page.locator('[data-lesson="khun"]')).toHaveAttribute('data-status', 'unlocked');
  await page.reload();
  await expect(page.locator('[data-lesson="board"]')).toHaveAttribute('data-status', 'completed');
});

test('lessons are available in English too (learn-002)', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'English' }).click();
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: 'Basics: the pieces' })).toBeVisible();
  await expect(page.locator('[data-lesson]')).toHaveCount(12);
  await page.goto('/learn/met');
  await expect(prompt(page)).toHaveText('The Met moves one square diagonally, in 4 directions.');
  await button(page, 'Continue').click();
  for (const sq of ['c3', 'c5', 'e3', 'e5']) await square(page, sq).click();
  await button(page, 'Check').click();
  await expect(feedback(page)).toContainText('Correct!');
});

test('a full piece lesson can be completed start to finish (learn-002)', async ({ page }) => {
  await page.goto('/learn/ma');
  await button(page, 'ต่อไป').click();
  for (const sq of ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5']) await square(page, sq).click();
  await button(page, 'ตรวจคำตอบ').click();
  await button(page, 'ต่อไป').click();
  await square(page, 'b1').click();
  await square(page, 'c3').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'ต่อไป').click();
  await page.locator('[data-choice="1"]').click();
  await button(page, 'ตรวจคำตอบ').click();
  await button(page, 'ต่อไป').click();
  await expect(page.getByTestId('lesson-complete')).toHaveAttribute('data-stars', '3');
  await button(page, 'ต่อไป').click();
  await expect(page.locator('[data-lesson="ma"]')).toHaveAttribute('data-status', 'completed');
});

test('move step: a wrong move shows feedback, the right move advances (learn-001)', async ({ page }) => {
  await page.goto('/learn/khun');
  await button(page, 'ต่อไป').click();
  for (const sq of ['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5']) await square(page, sq).click();
  await button(page, 'ตรวจคำตอบ').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'ต่อไป').click();

  await expect(prompt(page)).toHaveText('ใช้ขุนกินเบี้ยดำ');
  await square(page, 'd3').click();
  await square(page, 'c3').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'wrong');
  await button(page, 'ลองอีกครั้ง').click();
  await expect(pieceOn(page, 'd3')).toHaveAttribute('data-piece', 'wk');
  await square(page, 'd3').click();
  await square(page, 'e4').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await expect(feedback(page)).toContainText('เยี่ยม!');
  await button(page, 'ต่อไป').click();
  await expect(page.getByTestId('lesson-player')).toHaveAttribute('data-step', '3');
});
