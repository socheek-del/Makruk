import { type Browser, expect, type Page, test } from '@playwright/test';
import { play } from './helpers';

const PASSWORD = 'makruk-password-1';
const uniqueUser = (base: string) => `${base}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.slice(0, 20);
const plies = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');

/** Reads the latest email for `to` from the development outbox and returns the first link. */
async function emailedLink(page: Page, to: string): Promise<string> {
  await expect
    .poll(async () => ((await (await page.request.get(`/api/dev/outbox?to=${encodeURIComponent(to)}`)).json()) as { emails: unknown[] }).emails.length)
    .toBeGreaterThan(0);
  const { emails } = (await (await page.request.get(`/api/dev/outbox?to=${encodeURIComponent(to)}`)).json()) as { emails: Array<{ html: string }> };
  return /href="([^"]+)"/.exec(emails[0]!.html)![1]!;
}

async function registerAndConfirm(page: Page, base: string) {
  const username = uniqueUser(base);
  const email = `${username.toLowerCase()}@example.test`;
  await page.goto('/account');
  await page.getByRole('radio', { name: 'สมัครสมาชิก' }).click();
  const form = page.getByTestId('register-form');
  await form.getByLabel('ชื่อผู้ใช้', { exact: true }).fill(username);
  await form.getByLabel('อีเมล', { exact: true }).fill(email);
  await form.getByLabel('รหัสผ่าน', { exact: true }).fill(PASSWORD);
  await form.getByLabel('ยืนยันรหัสผ่าน', { exact: true }).fill(PASSWORD);
  await form.getByRole('button', { name: 'สร้างบัญชี' }).click();
  await expect(page.getByTestId('verification-sent')).toContainText(email);
  await page.goto(await emailedLink(page, email));
  await expect(page.getByTestId('account-name')).toHaveText(username);
  return { username, email };
}

async function signIn(page: Page, login: string, password: string) {
  await page.goto('/account');
  const form = page.getByTestId('sign-in-form');
  await form.getByLabel('ชื่อผู้ใช้หรืออีเมล').fill(login);
  await form.getByLabel('รหัสผ่าน', { exact: true }).fill(password);
  await form.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
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

test('register, confirm by email, sign in with username and password, reset a forgotten password (acct-002)', async ({ page }) => {
  // Unconfirmed accounts cannot sign in.
  const pendingName = uniqueUser('Pending');
  await page.goto('/account');
  await page.getByRole('radio', { name: 'สมัครสมาชิก' }).click();
  const form = page.getByTestId('register-form');
  await form.getByLabel('ชื่อผู้ใช้', { exact: true }).fill(pendingName);
  await form.getByLabel('อีเมล', { exact: true }).fill(`${pendingName.toLowerCase()}@example.test`);
  await form.getByLabel('รหัสผ่าน', { exact: true }).fill(PASSWORD);
  await form.getByLabel('ยืนยันรหัสผ่าน', { exact: true }).fill('different-password');
  await form.getByRole('button', { name: 'สร้างบัญชี' }).click();
  await expect(form.getByRole('alert')).toHaveText('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
  await form.getByLabel('ยืนยันรหัสผ่าน', { exact: true }).fill(PASSWORD);
  await form.getByRole('button', { name: 'สร้างบัญชี' }).click();
  await expect(page.getByTestId('verification-sent')).toBeVisible();
  await page.screenshot({ path: 'e2e-evidence/register-sent.png' });
  await signIn(page, pendingName, PASSWORD);
  await expect(page.getByTestId('sign-in-form').getByRole('alert')).toContainText('ยังไม่ได้ยืนยันอีเมล');

  // Confirmed account: sign out, sign back in, wrong password rejected.
  const { username, email } = await registerAndConfirm(page, 'Somchai');
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await expect(page.getByTestId('account-name')).toHaveText(/ผู้เล่น \d{4}/);
  await signIn(page, username, 'wrong-password-123');
  await expect(page.getByTestId('sign-in-form').getByRole('alert')).toHaveText('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await signIn(page, username, PASSWORD);
  await expect(page.getByTestId('account-name')).toHaveText(username);

  // Forgot password → email link → new password.
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await page.getByRole('link', { name: 'ลืมรหัสผ่าน?' }).click();
  await page.getByLabel('อีเมล', { exact: true }).fill(email);
  await page.getByRole('button', { name: 'ส่งลิงก์ตั้งรหัสผ่านใหม่' }).click();
  await expect(page.getByRole('status')).toContainText('ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว');
  await page.goto(await emailedLink(page, email));
  await page.getByLabel('รหัสผ่านใหม่', { exact: true }).fill('a-brand-new-password');
  await page.getByLabel('ยืนยันรหัสผ่าน', { exact: true }).fill('a-brand-new-password');
  await page.getByRole('button', { name: 'บันทึกรหัสผ่านใหม่' }).click();
  await expect(page.getByTestId('account-name')).toHaveText(username);

  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await signIn(page, username, PASSWORD);
  await expect(page.getByTestId('sign-in-form').getByRole('alert')).toHaveText('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  await signIn(page, email, 'a-brand-new-password');
  await expect(page.getByTestId('account-name')).toHaveText(username);
});

test('signed-in players play a rated game; ratings, history and replay update (acct-003)', async ({ browser }) => {
  const alice = await newPage(browser);
  const bob = await newPage(browser);
  const a = await registerAndConfirm(alice, 'Alice');
  const b = await registerAndConfirm(bob, 'Bob');
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
  await expect(item).toContainText(b.username);
  await expect(item.getByTestId('rating-change')).toHaveText(/^-\d+$/);
  await alice.screenshot({ path: 'e2e-evidence/account.png', fullPage: true });

  await bob.goto('/account');
  await expect(bob.getByTestId('history-item').first()).toHaveAttribute('data-outcome', 'win');
  expect(Number(await bob.getByTestId('rating-blitz').getAttribute('data-rating'))).toBeGreaterThan(1500);
  expect(a.username).not.toBe(b.username);

  await item.click();
  await expect(alice).toHaveURL(/\/replay\//);
  await expect(plies(alice)).toHaveText(['e4', 'd5']);
  await expect(alice.getByTestId('replay-info')).toContainText('นับคะแนน');
});

test("a guest's games move to the account after registering (acct-002)", async ({ browser }) => {
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
  await registerAndConfirm(carol, 'Carol');
  await expect(carol.getByTestId('history-item')).toHaveCount(1);
  await expect(carol.getByTestId('history-item').first()).toHaveAttribute('data-outcome', 'win');
});
