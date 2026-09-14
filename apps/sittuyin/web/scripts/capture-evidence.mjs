/**
 * Captures the screenshots that reviewers look at for sit-005 / sit-006.
 * Start the dev server first, then: npm run capture -w apps/sittuyin/web
 * Override the address with BASE_URL. Never point it at a public domain — the screenshots
 * must not show the site address (platform rule).
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5174';
const out = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'evidence');
await mkdir(out, { recursive: true });

const browser = await chromium.launch();

async function shot(name, width, height, fn, { dark = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme: dark ? 'dark' : 'light' });
  const page = await context.newPage();
  await fn(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, `${name}.png`) });
  console.log(`wrote docs/evidence/${name}.png`);
  await context.close();
}

const start = (page) => page.getByRole('button', { name: 'စတင်ရန်' }).click();
const autoArrange = async (page) => {
  await page.getByTestId('auto-arrange').click();
  await expect(page.locator('[data-hand]')).toHaveCount(0, { timeout: 30_000 });
};

await shot('app-home-390', 390, 780, (page) => page.goto(`${BASE}/`));
await shot('app-home-1280', 1280, 860, (page) => page.goto(`${BASE}/`));

await shot('app-setup-390', 390, 820, async (page) => {
  await page.goto(`${BASE}/play/local`);
  await start(page);
  await page.waitForSelector('[data-hand]');
});

await shot('app-play-1280', 1280, 860, async (page) => {
  await page.goto(`${BASE}/play/local`);
  await start(page);
  await autoArrange(page);
  for (const [from, to] of [
    ['a3', 'a4'],
    ['h6', 'h5'],
    ['b3', 'b4'],
  ]) {
    await page.locator(`[data-square="${from}"]`).click();
    await page.locator(`[data-square="${to}"]`).click();
    await page.waitForTimeout(250);
  }
});

await shot(
  'app-play-dark-1280',
  1280,
  860,
  async (page) => {
    await page.goto(`${BASE}/play/local`);
    await start(page);
    await autoArrange(page);
  },
  { dark: true },
);

await shot('app-computer-390', 390, 820, (page) => page.goto(`${BASE}/play/computer`));
await shot('app-settings-390', 390, 900, (page) => page.goto(`${BASE}/settings`));

await browser.close();
