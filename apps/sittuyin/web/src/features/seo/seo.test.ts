import { describe, expect, it } from 'vitest';
import en from '../../locales/en.json';
import my from '../../locales/my.json';
import { SITE_URL as CONFIGURED } from '../../../site.config';
import { applySeo, languageFromSearch, localizedUrl, pageSeo, SEO_PAGES, SITE_URL } from './seo';
import { buildRobots, buildSitemap, INDEXED_PAGES } from './sitemap';

describe('seo (sit-010)', () => {
  it('takes the site address from site.config.ts', () => {
    expect(SITE_URL).toBe(CONFIGURED);
    expect(SITE_URL).toMatch(/^https:\/\/[^/]+$/);
  });

  it('maps routes to pages, canonical paths and indexing', () => {
    expect(pageSeo('/')).toEqual({ page: 'home', path: '/', index: true });
    expect(pageSeo('/play/computer/')).toEqual({ page: 'computer', path: '/play/computer', index: true });
    expect(pageSeo('/play/online/ABC234')).toEqual({ page: 'room', path: '/play/online', index: false });
    expect(pageSeo('/learn/setup')).toEqual({ page: 'learn', path: '/learn', index: false });
    expect(pageSeo('/learn')).toEqual({ page: 'learn', path: '/learn', index: true });
    expect(pageSeo('/settings').index).toBe(false);
    expect(pageSeo('/design').index).toBe(false);
  });

  it('builds Burmese URLs without a query and English URLs with ?lang=en', () => {
    expect(localizedUrl('/learn', 'my')).toBe(`${SITE_URL}/learn`);
    expect(localizedUrl('/learn', 'en')).toBe(`${SITE_URL}/learn?lang=en`);
    expect(languageFromSearch('?lang=en')).toBe('en');
    expect(languageFromSearch('?lang=th')).toBeNull();
  });

  it('every page has a title and description in both languages that name the game', () => {
    for (const page of SEO_PAGES) {
      expect(my.seo[page].title).toMatch(/စစ်တုရင်/);
      expect(en.seo[page].title).toMatch(/Sittuyin|Burmese Chess/);
      expect(my.seo[page].description.length).toBeGreaterThan(20);
      expect(en.seo[page].description.length).toBeGreaterThan(20);
    }
    // Search results cut longer text.
    expect(en.seo.home.title.length).toBeLessThanOrEqual(70);
    expect(en.seo.home.description.length).toBeLessThanOrEqual(170);
    // People search in Burmese and in English, so the home page carries both names of the game.
    expect(en.seo.home.title).toMatch(/Sittuyin/);
    expect(en.seo.home.title).toMatch(/Burmese Chess/);
  });

  it('writes title, description, canonical, alternates and robots into the document head', () => {
    applySeo(pageSeo('/play/online/ABC234'), 'en', 'T', 'D');
    expect(document.title).toBe('T');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('D');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, follow');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_URL}/play/online?lang=en`);
    expect(document.head.querySelector('link[hreflang="my"]')?.getAttribute('href')).toBe(`${SITE_URL}/play/online`);
    applySeo(pageSeo('/'), 'my', 'T2', 'D2');
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('my_MM');
  });

  it('generates robots.txt and a bilingual sitemap for any domain', () => {
    const site = 'https://example.org';
    expect(buildRobots(site)).toContain('Sitemap: https://example.org/sitemap.xml');
    const xml = buildSitemap(site);
    expect(xml.match(/<url>/g)).toHaveLength(INDEXED_PAGES.length * 2);
    expect(xml).toContain('<loc>https://example.org/learn?lang=en</loc>');
    expect(xml).toContain('hreflang="my" href="https://example.org/about"');
    expect(xml).not.toContain('beanroti');
  });
});
