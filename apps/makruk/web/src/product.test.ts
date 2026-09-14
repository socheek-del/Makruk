import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRODUCT } from '../product.config';
import html from '../index.html?raw';
import main from './main.tsx?raw';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from './stores/settings';

// Vitest does not return CSS through `?raw`, so read the stylesheet from disk (tests run from the app root).
const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8');

describe('product config (plat-004)', () => {
  it('self-hosts and uses the declared UI font', () => {
    const [font] = PRODUCT.fonts;
    expect(css).toMatch(new RegExp(`--font-sans:\\s*'${font}'`));
    expect(main).toContain(`@fontsource/${font!.toLowerCase().replaceAll(' ', '-')}/`);
  });

  it('drives the default language, settings key and index.html placeholders', () => {
    expect(DEFAULT_SETTINGS.language).toBe(PRODUCT.defaultLocale);
    expect(SETTINGS_STORAGE_KEY).toBe(`${PRODUCT.storagePrefix}settings`);
    for (const placeholder of ['%DEFAULT_LOCALE%', '%LOCALES_JSON%', '%SETTINGS_KEY%']) expect(html).toContain(placeholder);
    expect(html).not.toMatch(/localStorage\.getItem\('makruk\./);
  });
});
