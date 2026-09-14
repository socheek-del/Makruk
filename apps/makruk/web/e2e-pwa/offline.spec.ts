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

test('the app is installable (manifest, icons, service worker) (polish-001)', async ({ page }) => {
  await waitForServiceWorker(page);
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();
  const manifest = await (await page.request.get(manifestHref!)).json();
  expect(manifest).toMatchObject({ short_name: 'หมากรุกไทย', display: 'standalone', start_url: '/' });
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));

  const client = await page.context().newCDPSession(page);
  const { installabilityErrors } = (await client.send('Page.getInstallabilityErrors')) as {
    installabilityErrors: Array<{ errorId: string }>;
  };
  expect(installabilityErrors).toEqual([]);
});

test('offline: play the computer and take a lesson (polish-001)', async ({ page, context }) => {
  await waitForServiceWorker(page);
  await context.setOffline(true);

  await page.goto('/play/computer');
  await page.locator('[data-bot-level="1"]').click();
  await page.getByRole('radio', { name: 'ขาว', exact: true }).click();
  await page.getByRole('button', { name: 'เริ่มเกม' }).click();
  await page.locator('[data-square="e3"]').click();
  await page.locator('[data-square="e4"]').click();
  await expect(page.getByTestId('move-list').locator('[data-ply]')).toHaveCount(2, { timeout: 15_000 });

  await page.goto('/learn/board');
  await expect(page.getByTestId('lesson-prompt')).toContainText('นี่คือกระดานหมากรุกไทย');
  await page.getByRole('button', { name: 'ต่อไป', exact: true }).click();
  await expect(page.getByTestId('lesson-prompt')).toContainText('เบี้ยตั้งอยู่แถวที่สาม');

  await page.goto('/play/local');
  await page.getByRole('button', { name: 'เริ่มเกม' }).click();
  await expect(page.locator('[data-square] [data-piece]')).toHaveCount(32);
});
