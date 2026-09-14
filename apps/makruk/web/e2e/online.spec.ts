import { type Browser, expect, type Page, test } from '@playwright/test';
import { pieceOn, play } from './helpers';

async function createRoom(page: Page, color: 'ขาว' | 'ดำ' = 'ขาว', timeControl = '5+0') {
  await page.goto('/play/online');
  await expect(page.getByRole('button', { name: 'สร้างห้อง' })).toBeEnabled();
  await page.locator(`[data-time-control="${timeControl}"]`).click();
  await page.getByRole('radio', { name: color, exact: true }).click();
  await page.getByRole('button', { name: 'สร้างห้อง' }).click();
  const code = (await page.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  return code;
}

async function twoPlayers(browser: Browser) {
  const host = await (await browser.newContext()).newPage();
  const friend = await (await browser.newContext()).newPage();
  const code = await createRoom(host);
  await friend.goto(`/play/online/${code}`);
  await expect(host.getByRole('grid')).toBeVisible();
  await expect(friend.getByRole('grid')).toBeVisible();
  return { host, friend, code };
}

const plies = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');

test('an anonymous seat token is created once and kept after reload, with no name shown (acct-001)', async ({ page }) => {
  const seat = () => page.evaluate(() => JSON.parse(localStorage.getItem('makruk.identity')!).user.id as string);
  const create = page.getByRole('button', { name: 'สร้างห้อง' });
  await page.goto('/play/online');
  await expect(create).toBeEnabled();
  const first = await seat();
  await page.reload();
  await expect(create).toBeEnabled();
  expect(await seat()).toBe(first);
  await expect(page.getByText(/ผู้เล่น \d{4}/)).toHaveCount(0);
});

test('create a room, a friend joins by code, both play and see the same board (online-002)', async ({ browser }) => {
  const host = await (await browser.newContext()).newPage();
  const friend = await (await browser.newContext()).newPage();
  const code = await createRoom(host);
  await expect(host.getByTestId('room-qr')).toBeVisible();
  await expect(host.getByTestId('room-link')).toContainText(`/play/online/${code}`);
  await host.screenshot({ path: 'e2e-evidence/online-waiting.png' });

  await friend.goto('/play/online');
  await friend.getByLabel('รหัสห้อง').fill(code.toLowerCase());
  await friend.getByRole('button', { name: 'เข้าร่วม', exact: true }).click();

  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'b');

  await play(host, [['e3', 'e4']]);
  await expect(plies(friend)).toHaveCount(1);
  await play(friend, [['d6', 'd5']]);
  await expect(plies(host)).toHaveCount(2);
  await play(host, [['e4', 'd5']]);
  await expect(plies(friend)).toHaveCount(3);
  await play(friend, [['g8', 'e7']]);
  await expect(plies(host)).toHaveCount(4);

  for (const page of [host, friend]) {
    await expect(plies(page)).toHaveText(['e4', 'd5', 'exd5', 'Ne7']);
    await expect(pieceOn(page, 'd5')).toHaveAttribute('data-piece', 'wp');
    await expect(pieceOn(page, 'e7')).toHaveAttribute('data-piece', 'bn');
    await expect(page.getByTestId('clock-w')).toBeVisible();
  }
  await friend.screenshot({ path: 'e2e-evidence/online-game.png' });
});

test('an unknown code shows an error (online-002)', async ({ page }) => {
  await page.goto('/play/online');
  await page.getByLabel('รหัสห้อง').fill('ZZZZZZ');
  await page.getByRole('button', { name: 'เข้าร่วม', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('ไม่พบห้องนี้');
});

test('a player who reloads rejoins the same game (online-004)', async ({ browser }) => {
  const { host, friend } = await twoPlayers(browser);
  await play(host, [['e3', 'e4']]);
  await expect(plies(friend)).toHaveCount(1);
  await host.reload();
  await expect(host.getByRole('grid')).toBeVisible();
  await expect(plies(host)).toHaveCount(1);
  await expect(friend.getByTestId('opponent-disconnected')).toHaveCount(0, { timeout: 10_000 });
  await play(friend, [['d6', 'd5']]);
  await expect(plies(host)).toHaveCount(2);
});

test('leaving for longer than the grace period loses by abandonment (online-004)', async ({ browser }) => {
  const { host, friend } = await twoPlayers(browser);
  await host.context().close();
  await expect(friend.getByTestId('opponent-disconnected')).toBeVisible();
  const dialog = friend.getByRole('dialog', { name: 'ฝ่ายดำชนะ' });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(dialog.getByTestId('result-reason')).toHaveText('ออกจากเกม');
});

test('draw offers can be declined or accepted, then a rematch swaps colours (online-004)', async ({ browser }) => {
  const { host, friend, code } = await twoPlayers(browser);

  await friend.getByRole('button', { name: 'ขอเสมอ' }).click();
  await expect(friend.getByTestId('draw-offered')).toBeVisible();
  await host.getByTestId('draw-offer').getByRole('button', { name: 'ปฏิเสธ' }).click();
  await expect(friend.getByTestId('draw-offered')).toHaveCount(0);

  await host.getByRole('button', { name: 'ขอเสมอ' }).click();
  await friend.getByTestId('draw-offer').getByRole('button', { name: 'ตกลง' }).click();
  for (const page of [host, friend]) {
    const dialog = page.getByRole('dialog', { name: 'เสมอ' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId('result-reason')).toHaveText('ตกลงเสมอ');
  }

  await host.getByRole('dialog', { name: 'เสมอ' }).getByRole('button', { name: 'เล่นอีกครั้ง' }).click();
  await expect(host.getByTestId('rematch-offered')).toBeAttached();
  await expect(friend.getByTestId('rematch-offer')).toBeAttached();
  await friend.getByRole('dialog', { name: 'เสมอ' }).getByRole('button', { name: 'เล่นอีกครั้ง' }).click();

  await expect(host).not.toHaveURL(new RegExp(`/play/online/${code}$`));
  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'b');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
});

test('resigning ends the online game for both players (online-004)', async ({ browser }) => {
  const { host, friend } = await twoPlayers(browser);
  await friend.getByRole('button', { name: 'ยอมแพ้' }).click();
  await friend.getByRole('dialog', { name: 'ฝ่ายดำยอมแพ้?' }).getByRole('button', { name: 'ยอมแพ้' }).click();
  for (const page of [host, friend]) {
    await expect(page.getByRole('dialog', { name: 'ฝ่ายขาวชนะ' })).toBeVisible();
  }
});
