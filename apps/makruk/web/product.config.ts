import type { ProductConfig } from '@chaturanga/game-shell';

export type Language = 'th' | 'en';

/**
 * plat-004: Makruk's languages, fonts and browser storage identity. Thai is the default language (plain
 * URLs, first visit); English is at `?lang=en`. Read by i18n, settings, SEO, the sitemap, index.html and the
 * PWA manifest.
 */
export const PRODUCT: ProductConfig<Language> = {
  id: 'makruk',
  locales: ['th', 'en'],
  defaultLocale: 'th',
  languageNames: { th: 'ไทย', en: 'English' },
  ogLocales: { th: 'th_TH', en: 'en_US' },
  fonts: ['Prompt'],
  storagePrefix: 'makruk.',
};
