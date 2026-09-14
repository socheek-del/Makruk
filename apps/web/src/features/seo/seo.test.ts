import { describe, expect, it } from 'vitest';
import en from '../../locales/en.json';
import th from '../../locales/th.json';
import { applySeo, languageFromSearch, localizedUrl, pageSeo, type SeoPage } from './seo';

describe('seo', () => {
  it('maps routes to pages, canonical paths and indexing', () => {
    expect(pageSeo('/')).toEqual({ page: 'home', path: '/', index: true });
    expect(pageSeo('/play/computer/')).toEqual({ page: 'computer', path: '/play/computer', index: true });
    expect(pageSeo('/play/online/ABC234')).toEqual({ page: 'room', path: '/play/online', index: false });
    expect(pageSeo('/learn/khun')).toEqual({ page: 'learn', path: '/learn', index: false });
    expect(pageSeo('/learn')).toEqual({ page: 'learn', path: '/learn', index: true });
    expect(pageSeo('/settings').index).toBe(false);
  });

  it('builds Thai URLs without a query and English URLs with ?lang=en', () => {
    expect(localizedUrl('/learn', 'th')).toBe('https://th-chess.beanroti.com/learn');
    expect(localizedUrl('/learn', 'en')).toBe('https://th-chess.beanroti.com/learn?lang=en');
    expect(languageFromSearch('?lang=en')).toBe('en');
    expect(languageFromSearch('?lang=fr')).toBeNull();
  });

  it('every page has a title and description in both languages that name Thai chess', () => {
    const pages: SeoPage[] = ['home', 'computer', 'online', 'room', 'local', 'learn', 'about', 'settings'];
    for (const page of pages) {
      expect(th.seo[page].title).toMatch(/หมากรุกไทย/);
      expect(en.seo[page].title).toMatch(/Makruk|Thai Chess/);
      expect(th.seo[page].description.length).toBeGreaterThan(20);
      expect(en.seo[page].description.length).toBeGreaterThan(20);
    }
    expect(en.seo.home.title.length).toBeLessThanOrEqual(70);
    expect(en.seo.home.description.length).toBeLessThanOrEqual(170);
  });

  it('writes title, description, canonical, alternates and robots into the document head', () => {
    applySeo(pageSeo('/play/online/ABC234'), 'en', 'T', 'D');
    expect(document.title).toBe('T');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('D');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, follow');
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://th-chess.beanroti.com/play/online?lang=en');
    expect(document.head.querySelector('link[hreflang="th"]')?.getAttribute('href')).toBe('https://th-chess.beanroti.com/play/online');
    applySeo(pageSeo('/'), 'th', 'T2', 'D2');
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('th_TH');
  });
});
