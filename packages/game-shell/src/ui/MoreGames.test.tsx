import { describe, expect, it } from 'vitest';
import { type SiblingSite, siblingHref } from './MoreGames';

const sittuyin: SiblingSite = { id: 'sittuyin', names: { my: 'စစ်တုရင်', en: 'Sittuyin' }, url: 'https://sittuyin.example', locales: ['my', 'en'], defaultLocale: 'my' };

describe('siblingHref (plat-006)', () => {
  it('keeps the viewer’s language when the sibling speaks it', () => {
    expect(siblingHref(sittuyin, 'en')).toBe('https://sittuyin.example/?lang=en');
  });

  it('uses the sibling’s default language otherwise, at its plain address', () => {
    expect(siblingHref(sittuyin, 'th')).toBe('https://sittuyin.example/');
    expect(siblingHref(sittuyin, 'my')).toBe('https://sittuyin.example/');
  });
});
