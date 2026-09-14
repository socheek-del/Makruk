import { expect, test } from '@playwright/test';

const REPO = 'https://github.com/socheek-del/chaturanga';

test('the About page explains Sittuyin and links contributors to GitHub, in Burmese and English (sit-010)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'အကြောင်း', exact: true }).click();

  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { name: 'အကြောင်း', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'စစ်တုရင် ဆိုသည်မှာ' })).toBeVisible();
  const contribute = page.getByTestId('contribute');
  await expect(contribute.getByRole('link', { name: 'အရင်းအမြစ်ကို ကြည့်ရန်' })).toHaveAttribute('href', REPO);
  await expect(contribute.getByRole('link', { name: 'ကူညီပံ့ပိုးနည်း' })).toHaveAttribute('href', `${REPO}/blob/main/CONTRIBUTING.md`);
  await expect(contribute.getByRole('link', { name: 'ချို့ယွင်းချက် တင်ပြရန် သို့မဟုတ် အကြံပေးရန်' })).toHaveAttribute('href', `${REPO}/issues/new`);
  await expect(contribute.getByRole('link', { name: 'မြန်မာစာ စစ်ဆေးရာတွင် ကူညီရန်' })).toHaveAttribute(
    'href',
    `${REPO}/blob/main/apps/sittuyin/docs/i18n-review.md`,
  );
  await expect(contribute.getByRole('link').first()).toHaveAttribute('target', '_blank');
  await page.screenshot({ path: 'e2e-evidence/about.png', fullPage: true });

  await page.goto('/about?lang=en');
  await expect(page.getByRole('heading', { name: 'About', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What is Sittuyin?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Help review the Burmese text' })).toBeVisible();
});
