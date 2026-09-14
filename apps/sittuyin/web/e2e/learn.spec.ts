import { expect, type Page, test } from '@playwright/test';
import { place, square } from './helpers';

const prompt = (page: Page) => page.getByTestId('lesson-prompt');
const feedback = (page: Page) => page.getByTestId('feedback');
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test('the lesson path lists every lesson, all open (sit-007)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'သင်ယူရန်', exact: true }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('[data-lesson]')).toHaveCount(12);
  await expect(page.locator('[data-lesson][data-status="locked"]')).toHaveCount(0);
  await expect(page.getByTestId('xp')).toHaveText('0 XP');
});

test('the setup lesson is completed start to finish in Burmese, with a wrong answer on the way (sit-007)', async ({ page }) => {
  await page.goto('/learn');
  await page.locator('[data-lesson="setup"] a').click();

  await expect(prompt(page)).toContainText('နှစ်ဖက်စလုံးသည် အလှည့်ကျ');
  await button(page, 'ဆက်လုပ်ရန်').click();
  await expect(prompt(page)).toContainText('ရထားမူကား ခြွင်းချက်');
  await button(page, 'ဆက်လုပ်ရန်').click();

  // Placement step: the tray shows White's pieces; a Yahhta is placed on the back rank.
  await expect(prompt(page)).toHaveText('ရထားတစ်ခုကို ချပါ။');
  await expect(page.locator('[data-hand="w"]')).toBeVisible();
  // A Myin placed off the back rank is a legal move but not the answer.
  await place(page, 'w', 'n', 'c2');
  await expect(feedback(page)).toHaveAttribute('data-result', 'wrong');
  await button(page, 'ထပ်ကြိုးစားရန်').click();
  await expect(page.locator('[data-square="c2"] [data-piece]')).toHaveCount(0);
  // Rank 2 is refused for a Yahhta: the tap only clears the selection, as in a real game.
  await place(page, 'w', 'r', 'd2');
  await expect(feedback(page)).toHaveCount(0);
  await expect(page.locator('[data-square="d2"] [data-piece]')).toHaveCount(0);
  await place(page, 'w', 'r', 'd1');
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'ဆက်လုပ်ရန်').click();

  await page.locator('[data-choice="0"]').click();
  await button(page, 'စစ်ဆေးရန်').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await button(page, 'ဆက်လုပ်ရန်').click();

  const complete = page.getByTestId('lesson-complete');
  await expect(complete).toBeVisible();
  await expect(complete).toHaveAttribute('data-stars', '2');
  await expect(complete).toContainText('+15 XP');
  await button(page, 'ဆက်လုပ်ရန်').click();

  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('[data-lesson="setup"]')).toHaveAttribute('data-status', 'completed');
  await expect(page.getByTestId('xp')).toHaveText('15 XP');
  await page.reload();
  await expect(page.locator('[data-lesson="setup"]')).toHaveAttribute('data-status', 'completed');
});

test('the promotion lesson is completed start to finish in English, promoting in place (sit-007)', async ({ page }) => {
  await page.goto('/learn?lang=en');
  await expect(page.getByRole('heading', { name: 'Winning the game' })).toBeVisible();
  await page.locator('[data-lesson="promotion"] a').click();

  await expect(prompt(page)).toContainText('A Ne can become a Sit-ke.');
  await button(page, 'Continue').click();
  await expect(prompt(page)).toContainText('Promotion is a move of its own.');
  await button(page, 'Continue').click();

  await expect(prompt(page)).toHaveText('Promote the Ne on d5 into a Sit-ke.');
  await square(page, 'd5').click();
  await page.getByTestId('promote-in-place').click();
  await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
  await expect(page.locator('[data-square="d5"] [data-piece]')).toHaveAttribute('data-piece', /^wf/);
  await button(page, 'Continue').click();

  for (let i = 0; i < 2; i++) {
    await page.locator('[data-choice="0"]').click();
    await button(page, 'Check').click();
    await expect(feedback(page)).toHaveAttribute('data-result', 'correct');
    await button(page, 'Continue').click();
  }

  const complete = page.getByTestId('lesson-complete');
  await expect(complete).toHaveAttribute('data-stars', '3');
  await expect(complete).toContainText('Lesson complete!');
  await expect(complete).toContainText('+20 XP');
  await button(page, 'Continue').click();
  await expect(page.locator('[data-lesson="promotion"]')).toHaveAttribute('data-status', 'completed');
});
