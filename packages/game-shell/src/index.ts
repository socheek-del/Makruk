/**
 * Shared app layer for the game sites. Each site declares a ProductConfig (languages, fonts, storage
 * identity); these helpers turn it into language handling and search-engine tags. Game-specific content
 * never lives here.
 */
export { isLocale, localeFromSearch, type ProductConfig, resolveLocale, storageKey } from './product';
export { applySeo, localizedUrl, type SeoTarget } from './seo';
