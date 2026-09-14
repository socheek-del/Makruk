import { type Browser, expect, type Page, test } from '@playwright/test';
import { play } from './helpers';

const plies = (page: Page) => page.getByTestId('move-list').locator('[data-ply]');
const hands = (page: Page) => page.locator('[data-hand]');

async function newPlayer(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/play/online');
  await expect(page.getByRole('button', { name: 'အခန်း ဖန်တီးရန်' })).toBeEnabled();
  return page;
}

/** Every piece on the board, by square, as the page shows it. */
const boardOf = (page: Page) =>
  page
    .locator('[data-square]')
    .evaluateAll((cells) =>
      Object.fromEntries(
        cells.flatMap((cell) => {
          const piece = cell.querySelector('[data-piece]')?.getAttribute('data-piece');
          return piece ? [[cell.getAttribute('data-square'), piece]] : [];
        }),
      ),
    );

test('create a room, a friend joins by code, both finish the setup and play 4 moves on the same board (sit-008)', async ({ browser }) => {
  const host = await newPlayer(browser);
  await host.locator('[data-time-control="5+0"]').click();
  await host.getByRole('radio', { name: 'အဖြူ', exact: true }).click();
  await host.getByRole('button', { name: 'အခန်း ဖန်တီးရန်' }).click();
  const code = (await host.getByTestId('room-code').textContent())!.trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  await expect(host.getByTestId('room-link')).toContainText(`/play/online/${code}`);

  const friend = await newPlayer(browser);
  await friend.getByLabel('အခန်းကုဒ်').fill(code.toLowerCase());
  await friend.getByRole('button', { name: 'ဝင်ရန်', exact: true }).click();

  await expect(host.getByRole('grid')).toHaveAttribute('data-orientation', 'w');
  await expect(friend.getByRole('grid')).toHaveAttribute('data-orientation', 'b');

  // Setup phase: both hands are shown and the clocks do not run.
  await expect(hands(host)).toHaveCount(2);
  const whiteClock = await host.getByTestId('clock-w').textContent();
  await host.waitForTimeout(1_500);
  await expect(host.getByTestId('clock-w')).toHaveText(whiteClock!);

  // Each player arranges only their own pieces; the placements alternate through the server.
  await host.getByTestId('auto-arrange').click();
  await friend.getByTestId('auto-arrange').click();
  for (const page of [host, friend]) {
    await expect(hands(page)).toHaveCount(0, { timeout: 30_000 });
    await expect(plies(page)).toHaveCount(16);
  }

  // Ne pushes are legal whatever the arrangement, because every placed piece stays behind its own Ne.
  await play(host, [['a3', 'a4']]);
  await expect(plies(friend)).toHaveCount(17);
  await play(friend, [['e6', 'e5']]);
  await expect(plies(host)).toHaveCount(18);
  await play(host, [['b3', 'b4']]);
  await expect(plies(friend)).toHaveCount(19);
  await play(friend, [['f6', 'f5']]);
  await expect(plies(host)).toHaveCount(20);

  const hostMoves = await plies(host).allTextContents();
  expect(await plies(friend).allTextContents()).toEqual(hostMoves);
  const hostBoard = await boardOf(host);
  expect(await boardOf(friend)).toEqual(hostBoard);
  expect(hostBoard).toMatchObject({ a4: 'wp', b4: 'wp', e5: 'bp', f5: 'bp' });
  expect(Object.keys(hostBoard)).toHaveLength(32);

  // The clock started after the last placement and is running now.
  const running = await friend.getByTestId('clock-w').textContent();
  await expect(friend.getByTestId('clock-w')).not.toHaveText(running!, { timeout: 5_000 });

  // No chat of any kind.
  await expect(host.getByRole('textbox')).toHaveCount(0);
  await host.screenshot({ path: 'e2e-evidence/online-game.png' });
});

test('an unknown code shows an error (sit-008)', async ({ page }) => {
  await page.goto('/play/online');
  await page.getByLabel('အခန်းကုဒ်').fill('ZZZZZZ');
  await page.getByRole('button', { name: 'ဝင်ရန်', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('ဤအခန်းကို ရှာမတွေ့ပါ');
});

test('quick match pairs two players into a Sittuyin game that opens with the setup (sit-008)', async ({ browser }) => {
  const a = await newPlayer(browser);
  const b = await newPlayer(browser);
  await a.locator('[data-pool="3+2"]').click();
  await expect(a.getByTestId('searching')).toContainText('3+2');
  await b.locator('[data-pool="3+2"]').click();

  await expect(a).toHaveURL(/\/play\/online\/[A-HJ-NP-Z2-9]{6}$/);
  await expect(b).toHaveURL(a.url());
  const orientations = [await a.getByRole('grid').getAttribute('data-orientation'), await b.getByRole('grid').getAttribute('data-orientation')];
  expect(orientations.sort()).toEqual(['b', 'w']);
  await expect(hands(a)).toHaveCount(2);
  await expect(a.getByTestId('clock-w')).toHaveText('3:00');
});

test('the online lobby is in English too, and the seat token is Sittuyin-only', async ({ page }) => {
  await page.goto('/play/online?lang=en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Play online');
  await expect(page.getByRole('button', { name: 'Create room' })).toBeEnabled();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toContain('sittuyin.identity');
  expect(keys.some((key) => key.startsWith('makruk.'))).toBe(false);
});
