import { type Browser, expect, type Page, test } from '@playwright/test';
import { play } from './helpers';

const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const plies = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');

async function signIn(page: Page, name: string) {
  await page.goto('/account');
  const form = page.getByTestId('test-login');
  await form.getByLabel('ชื่อ').fill(name);
  await form.getByLabel('อีเมล').fill(`${name.toLowerCase()}-${unique()}@example.test`);
  await form.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await expect(page.getByTestId('account-name')).toHaveText(name);
}

async function newPage(browser: Browser) {
  return (await browser.newContext()).newPage();
}

async function createRoom(page: Page) {
  await page.goto('/play/online');
  await page.locator('[data-time-control="5+0"]').click();
  await page.getByRole('radio', { name: 'ขาว', exact: true }).click();
  await page.getByRole('button', { name: 'สร้างห้อง' }).click();
  return (await page.getByTestId('room-code').textContent())!.trim();
}

test('signed-in players play a rated game; ratings, history and replay update (acct-003)', async ({ browser }) => {
  const alice = await newPage(browser);
  const bob = await newPage(browser);
  await signIn(alice, 'Alice');
  await signIn(bob, 'Bob');
  await expect(alice.getByTestId('rating-blitz')).toHaveAttribute('data-rating', '1500');

  await alice.goto('/play/online');
  await expect(alice.getByRole('switch', { name: 'นับคะแนน (เมื่อทั้งสองฝ่ายเข้าสู่ระบบ)' })).toHaveAttribute('aria-checked', 'true');
  const code = await createRoom(alice);
  await bob.goto(`/play/online/${code}`);
  await expect(alice.getByTestId('rated-badge')).toBeVisible();

  await play(alice, [['e3', 'e4']]);
  await expect(plies(bob)).toHaveCount(1);
  await play(bob, [['d6', 'd5']]);
  await expect(plies(alice)).toHaveCount(2);
  await alice.getByRole('button', { name: 'ยอมแพ้' }).click();
  await alice.getByRole('dialog', { name: 'ฝ่ายขาวยอมแพ้?' }).getByRole('button', { name: 'ยอมแพ้' }).click();
  await expect(bob.getByRole('dialog', { name: 'ฝ่ายดำชนะ' })).toBeVisible();

  await alice.goto('/account');
  await expect(alice.getByTestId('history-item')).toHaveCount(1);
  expect(Number(await alice.getByTestId('rating-blitz').getAttribute('data-rating'))).toBeLessThan(1500);
  const item = alice.getByTestId('history-item').first();
  await expect(item).toHaveAttribute('data-outcome', 'loss');
  await expect(item).toContainText('Bob');
  await expect(item.getByTestId('rating-change')).toHaveText(/^-\d+$/);
  await alice.screenshot({ path: 'e2e-evidence/account.png', fullPage: true });

  await bob.goto('/account');
  await expect(bob.getByTestId('history-item').first()).toHaveAttribute('data-outcome', 'win');
  expect(Number(await bob.getByTestId('rating-blitz').getAttribute('data-rating'))).toBeGreaterThan(1500);

  await item.click();
  await expect(alice).toHaveURL(/\/replay\//);
  await expect(plies(alice)).toHaveText(['e4', 'd5']);
  await expect(alice.getByTestId('replay-info')).toContainText('นับคะแนน');
});

test("a guest's games move to the account after signing in (acct-002)", async ({ browser }) => {
  const carol = await newPage(browser);
  const dan = await newPage(browser);
  const code = await createRoom(carol);
  await dan.goto(`/play/online/${code}`);
  await expect(carol.getByRole('grid')).toBeVisible();
  await dan.getByRole('button', { name: 'ยอมแพ้' }).click();
  await dan.getByRole('dialog', { name: 'ฝ่ายดำยอมแพ้?' }).getByRole('button', { name: 'ยอมแพ้' }).click();
  await expect(carol.getByRole('dialog', { name: 'ฝ่ายขาวชนะ' })).toBeVisible();

  await carol.goto('/account');
  await expect(carol.getByTestId('history-item')).toHaveCount(1);
  await signIn(carol, 'Carol');
  await expect(carol.getByTestId('history-item')).toHaveCount(1);
  await expect(carol.getByTestId('history-item').first()).toHaveAttribute('data-outcome', 'win');

  await carol.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await expect(carol.getByTestId('account-name')).toHaveText(/ผู้เล่น \d{4}/);
});
