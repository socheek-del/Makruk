import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRODUCT as MAKRUK } from '../../../apps/makruk/web/product.config';
import { SITE_URL as MAKRUK_URL } from '../../../apps/makruk/web/site.config';
import { SITE_URL as SITTUYIN_URL } from '../../../apps/sittuyin/web/site.config';
import { GAMES } from './games';
import { familyLinks, SITE_LANGUAGES } from './sites';

describe('family (plat-006)', () => {
  it('names every game in every language any family site declares', () => {
    expect([...SITE_LANGUAGES].sort()).toEqual(['en', 'my', 'th']);
    for (const game of GAMES) {
      for (const language of SITE_LANGUAGES) {
        expect((game.names as Record<string, string>)[language]?.trim(), `${game.id} in ${language}`).toBeTruthy();
      }
    }
  });

  it('links each site to its siblings only, at the address from the sibling’s own site.config', () => {
    expect(familyLinks('makruk')).toEqual([
      expect.objectContaining({ id: 'sittuyin', url: SITTUYIN_URL, locales: ['my', 'en'], defaultLocale: 'my' }),
    ]);
    expect(familyLinks('sittuyin')).toEqual([
      expect.objectContaining({ id: 'makruk', url: MAKRUK_URL, locales: MAKRUK.locales, defaultLocale: 'th' }),
    ]);
    for (const game of GAMES) expect(familyLinks(game.id).map((link) => link.id)).not.toContain(game.id);
  });

  it('never hardcodes an address', () => {
    const dir = import.meta.dirname;
    for (const file of readdirSync(dir).filter((name) => !name.endsWith('.test.ts'))) {
      expect(readFileSync(path.join(dir, file), 'utf8'), file).not.toMatch(/https?:\/\//);
    }
  });
});
