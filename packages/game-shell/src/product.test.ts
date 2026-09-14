// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { isLocale, localeFromSearch, type ProductConfig, resolveLocale, storageKey } from './product';
import { applySeo, localizedUrl } from './seo';
import { localeProblems } from './testing/locales';

type Lang = 'my' | 'en';

const product: ProductConfig<Lang> = {
  id: 'demo',
  locales: ['my', 'en'],
  defaultLocale: 'my',
  languageNames: { my: 'မြန်မာ', en: 'English' },
  ogLocales: { my: 'my_MM', en: 'en_US' },
  fonts: ['Noto Sans Myanmar'],
  storagePrefix: 'demo.',
};
const SITE = 'https://example.org';

describe('product languages (plat-004)', () => {
  it('accepts only declared languages and falls back to the default', () => {
    expect(isLocale(product, 'en')).toBe(true);
    expect(isLocale(product, 'th')).toBe(false);
    expect(resolveLocale(product, 'en')).toBe('en');
    expect(resolveLocale(product, 'th')).toBe('my');
    expect(resolveLocale(product, undefined)).toBe('my');
  });

  it('reads ?lang= only for declared languages', () => {
    expect(localeFromSearch(product, '?lang=en')).toBe('en');
    expect(localeFromSearch(product, '?lang=my&x=1')).toBe('my');
    expect(localeFromSearch(product, '?lang=th')).toBeNull();
    expect(localeFromSearch(product, '')).toBeNull();
  });

  it('prefixes storage keys with the product', () => {
    expect(storageKey(product, 'settings')).toBe('demo.settings');
  });
});

describe('seo (plat-004)', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('puts the default language at the plain URL and others at ?lang=', () => {
    expect(localizedUrl(product, SITE, '/learn', 'my')).toBe(`${SITE}/learn`);
    expect(localizedUrl(product, SITE, '/learn', 'en')).toBe(`${SITE}/learn?lang=en`);
  });

  it('writes one alternate per declared language plus x-default, and the Open Graph locale', () => {
    applySeo(product, SITE, { path: '/play', index: false }, 'en', 'Title', 'Description');
    applySeo(product, SITE, { path: '/play', index: true }, 'en', 'Title', 'Description');
    const hreflangs = [...document.head.querySelectorAll('link[rel="alternate"]')].map((l) => [
      l.getAttribute('hreflang'),
      l.getAttribute('href'),
    ]);
    expect(hreflangs).toEqual([
      ['my', `${SITE}/play`],
      ['en', `${SITE}/play?lang=en`],
      ['x-default', `${SITE}/play`],
    ]);
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE}/play?lang=en`);
    expect(document.head.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US');
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('index, follow');
    expect(document.title).toBe('Title');
  });
});

describe('locale completeness (plat-004)', () => {
  const my = { nav: { play: 'ကစားမည်', learn: 'လေ့လာမည်' }, title: 'စစ်တုရင်' };

  it('reports nothing for complete dictionaries', () => {
    const problems = localeProblems(product, { my, en: { nav: { play: 'Play', learn: 'Learn' }, title: 'Sittuyin' } });
    expect(problems).toEqual({
      undeclared: [],
      missingDictionaries: [],
      missing: { my: [], en: [] },
      extra: { my: [], en: [] },
      empty: { my: [], en: [] },
    });
  });

  it('reports a missing key, an extra key, an empty text, a missing and an undeclared dictionary', () => {
    const problems = localeProblems(product, { my, en: { nav: { play: 'Play', settings: 'Settings' }, title: ' ' }, th: {} });
    expect(problems.missing.en).toEqual(['nav.learn']);
    expect(problems.extra.en).toEqual(['nav.settings']);
    expect(problems.empty.en).toEqual(['title']);
    expect(problems.undeclared).toEqual(['th']);
    expect(localeProblems(product, { my }).missingDictionaries).toEqual(['en']);
  });
});
