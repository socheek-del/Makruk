import type { ProductConfig } from '@chaturanga/game-shell';

export type Language = 'my' | 'en';

/**
 * Sittuyin's languages, fonts and browser storage identity. Burmese is the default language (plain URLs,
 * first visit); English is at `?lang=en`. Burmese is Unicode only — never Zawgyi.
 */
export const PRODUCT: ProductConfig<Language> = {
  id: 'sittuyin',
  locales: ['my', 'en'],
  defaultLocale: 'my',
  languageNames: { my: 'မြန်မာ', en: 'English' },
  ogLocales: { my: 'my_MM', en: 'en_US' },
  fonts: ['Noto Sans Myanmar', 'Noto Sans'],
  storagePrefix: 'sittuyin.',
};
