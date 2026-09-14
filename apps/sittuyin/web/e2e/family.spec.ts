import { expect, test } from '@playwright/test';
// Relative path on purpose: Playwright transforms files in the repository, not workspace packages.
import { familyLinks } from '../../../../packages/family/src/sites';

const [makruk] = familyLinks('sittuyin');

test('Sittuyin links to Makruk at its configured address, in the site language (plat-006)', async ({ page }) => {
  expect(makruk?.id).toBe('makruk');

  await page.goto('/');
  const section = page.getByTestId('more-games');
  await expect(section.getByRole('heading')).toHaveText('အခြား ဂိမ်းများ');
  // Makruk has no Burmese, so a Burmese visitor lands on its default language at the plain address.
  await expect(section.getByRole('link', { name: 'ထိုင်းစစ်တုရင်' })).toHaveAttribute('href', `${makruk!.url}/`);
  await expect(page.getByTestId('family-footer').getByRole('link', { name: 'ထိုင်းစစ်တုရင်' })).toHaveAttribute('href', `${makruk!.url}/`);

  await page.goto('/learn?lang=en');
  const footer = page.getByTestId('family-footer');
  await expect(footer).toContainText('More games');
  await expect(footer.getByRole('link', { name: 'Makruk (Thai chess)' })).toHaveAttribute('href', `${makruk!.url}/?lang=en`);

  // Only the sibling's name crosses over: one link each, none back to Sittuyin, and no Thai text.
  await page.goto('/?lang=my');
  await expect(page.getByTestId('more-games').getByRole('link')).toHaveCount(1);
  await expect(page.getByTestId('family-footer').getByRole('link')).toHaveCount(1);
  expect(await page.locator('body').textContent()).not.toMatch(/[฀-๿]/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'e2e-evidence/more-games-390.png', fullPage: true });
});
