import { type Browser, expect, type Page, test } from '@playwright/test';

async function seeker(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto('/play/online');
  await expect(page.getByTestId('identity')).toBeVisible();
  return page;
}

test('two players pressing the same pool are paired into one game (online-005)', async ({ browser }) => {
  const a = await seeker(browser);
  const b = await seeker(browser);
  await a.locator('[data-pool="3+2"]').click();
  await expect(a.getByTestId('searching')).toContainText('3+2');
  await b.locator('[data-pool="3+2"]').click();

  await expect(a).toHaveURL(/\/play\/online\/[A-HJ-NP-Z2-9]{6}$/);
  await expect(b).toHaveURL(a.url());
  await expect(a.getByRole('grid')).toBeVisible();
  await expect(b.getByRole('grid')).toBeVisible();
  const orientations = [await a.getByRole('grid').getAttribute('data-orientation'), await b.getByRole('grid').getAttribute('data-orientation')];
  expect(orientations.sort()).toEqual(['b', 'w']);
  await expect(a.getByTestId('clock-w')).toHaveText(/^[23]:\d\d$/);
});

test('cancelling a search removes you from the queue (online-005)', async ({ browser }) => {
  const quitter = await seeker(browser);
  await quitter.locator('[data-pool="10+0"]').click();
  await expect(quitter.getByTestId('searching')).toBeVisible();
  await quitter.getByTestId('searching').getByRole('button', { name: 'ยกเลิก' }).click();
  await expect(quitter.getByTestId('searching')).toHaveCount(0);

  const waiter = await seeker(browser);
  await waiter.locator('[data-pool="10+0"]').click();
  await expect(waiter.getByTestId('searching')).toBeVisible();
  await waiter.waitForTimeout(1_500);
  await expect(waiter).toHaveURL(/\/play\/online$/);
  await expect(quitter).toHaveURL(/\/play\/online$/);

  const joiner = await seeker(browser);
  await joiner.locator('[data-pool="10+0"]').click();
  await expect(waiter).toHaveURL(/\/play\/online\/[A-HJ-NP-Z2-9]{6}$/);
  await expect(joiner).toHaveURL(waiter.url());
  await expect(quitter).toHaveURL(/\/play\/online$/);
});
