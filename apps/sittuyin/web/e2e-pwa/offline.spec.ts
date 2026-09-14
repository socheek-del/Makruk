import { expect, type Page, test } from '@playwright/test';

async function waitForServiceWorker(page: Page) {
  await page.goto('/');
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
    return registration.active?.state;
  });
  // A reload makes sure every navigation from now on is served by the service worker.
  await page.reload();
}

test('the app is installable (manifest, icons, service worker) (sit-006)', async ({ page }) => {
  await waitForServiceWorker(page);
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();
  const manifest = await (await page.request.get(manifestHref!)).json();
  expect(manifest).toMatchObject({ short_name: 'စစ်တုရင်', display: 'standalone', start_url: '/' });
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));

  const client = await page.context().newCDPSession(page);
  const { installabilityErrors } = (await client.send('Page.getInstallabilityErrors')) as {
    installabilityErrors: Array<{ errorId: string }>;
  };
  expect(installabilityErrors).toEqual([]);
});

test('offline: setup, play the computer and play locally (sit-006)', async ({ page, context }) => {
  await waitForServiceWorker(page);
  await context.setOffline(true);

  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('button', { name: 'စတင်ရန်' }).click();
  await page.getByTestId('auto-arrange').click();
  await expect(page.locator('[data-hand]')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.getByTestId('turn-banner')).toHaveText('အဖြူ ၏ အလှည့်');

  await page.locator('[data-square="a3"]').click();
  const to = (await page.locator('[data-square][data-target]').first().getAttribute('data-square'))!;
  await page.locator(`[data-square="${to}"]`).click();
  await expect(page.getByTestId('turn-banner')).toHaveText('အဖြူ ၏ အလှည့်', { timeout: 30_000 });

  await page.goto('/play/local');
  await page.getByRole('button', { name: 'စတင်ရန်' }).click();
  await page.getByTestId('auto-arrange').click();
  await expect(page.locator('[data-hand]')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator('[data-square] [data-piece]')).toHaveCount(32);
});
