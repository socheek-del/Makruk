import { expect, test } from '@playwright/test';
import { SITE_URL as SITE } from '../site.config';

test('pages set search titles, descriptions, canonical and language alternates; ?lang=en opens English (sit-010)', async ({ page }) => {
  const canonical = page.locator('link[rel="canonical"]');
  const description = page.locator('meta[name="description"]');

  await page.goto('/learn');
  await expect(page).toHaveTitle('စစ်တုရင် သင်ယူရန် — စည်းမျဉ်းနှင့် သင်ခန်းစာများ | စစ်တုရင်');
  await expect(description).toHaveAttribute('content', /သင်ခန်းစာများ/);
  await expect(canonical).toHaveAttribute('href', `${SITE}/learn`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  await expect(description).toHaveCount(1);

  await page.goto('/play/computer?lang=en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle('Play Burmese Chess vs Computer — 6 Levels | Sittuyin');
  await expect(canonical).toHaveAttribute('href', `${SITE}/play/computer?lang=en`);
  await expect(page.locator('link[rel="alternate"][hreflang="my"]')).toHaveAttribute('href', `${SITE}/play/computer`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute('href', `${SITE}/play/computer?lang=en`);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Play Burmese Chess vs Computer — 6 Levels | Sittuyin');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US');

  // The language chosen by the link is remembered; room links are not indexed.
  await page.goto('/about');
  await expect(page).toHaveTitle('About Sittuyin (Burmese Chess) & This Open-Source Project');
  await page.goto('/play/online/ABC234');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');

  const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)['@graph'];
  expect(graph.map((node: { '@id': string }) => node['@id'])).toEqual([`${SITE}/#website`, `${SITE}/#game`]);
  expect(graph[1].alternateName).toEqual(expect.arrayContaining(['Burmese Chess', 'စစ်တုရင်']));

  expect(await (await page.request.get('/robots.txt')).text()).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  for (const path of ['/', '/play/computer', '/play/online', '/learn', '/about']) expect(sitemap).toContain(`<loc>${SITE}${path}</loc>`);
  expect(sitemap).toContain(`<loc>${SITE}/learn?lang=en</loc>`);
  const og = await page.request.get('/og-image.png');
  expect(og.headers()['content-type']).toBe('image/png');
});
