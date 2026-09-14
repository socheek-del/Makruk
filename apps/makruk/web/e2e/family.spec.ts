import { expect, test } from '@playwright/test';
// Relative path on purpose: Playwright transforms files in the repository, not workspace packages.
import { familyLinks } from '../../../../packages/family/src/sites';

const [sittuyin] = familyLinks('makruk');

test('Makruk links to Sittuyin at its configured address, in the site language (plat-006)', async ({ page }) => {
  expect(sittuyin?.id).toBe('sittuyin');

  await page.goto('/');
  const section = page.getByTestId('more-games');
  await expect(section.getByRole('heading')).toHaveText('เกมอื่น ๆ');
  // Sittuyin has no Thai, so a Thai visitor lands on its default language at the plain address.
  await expect(section.getByRole('link', { name: 'หมากรุกพม่า' })).toHaveAttribute('href', `${sittuyin!.url}/`);
  await expect(page.getByTestId('family-footer').getByRole('link', { name: 'หมากรุกพม่า' })).toHaveAttribute('href', `${sittuyin!.url}/`);

  // The footer is on every page, not only the home page.
  await page.goto('/learn?lang=en');
  const footer = page.getByTestId('family-footer');
  await expect(footer).toContainText('More games');
  await expect(footer.getByRole('link', { name: 'Sittuyin (Burmese chess)' })).toHaveAttribute('href', `${sittuyin!.url}/?lang=en`);

  // Only the sibling's name crosses over: one link each, none back to Makruk, and no Burmese text.
  await page.goto('/?lang=th');
  await expect(page.getByTestId('more-games').getByRole('link')).toHaveCount(1);
  await expect(page.getByTestId('family-footer').getByRole('link')).toHaveCount(1);
  expect(await page.locator('body').textContent()).not.toMatch(/[က-႟]/);
  await page.getByTestId('more-games').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'e2e-evidence/more-games.png', fullPage: true });
});
