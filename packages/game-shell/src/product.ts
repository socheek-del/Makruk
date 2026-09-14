/** What makes a game site its own product: its languages, fonts and browser storage identity (plat-004). */
export interface ProductConfig<L extends string = string> {
  /** Stable product id, e.g. 'makruk'. */
  readonly id: string;
  /** Languages the site offers, in display order. */
  readonly locales: readonly L[];
  /** Language of plain URLs, first visits and missing translations. */
  readonly defaultLocale: L;
  /** Each language's own name, shown in the language switch. */
  readonly languageNames: Readonly<Record<L, string>>;
  /** Open Graph locale per language, e.g. `th_TH`. */
  readonly ogLocales: Readonly<Record<L, string>>;
  /** UI font families, primary first; the app self-hosts them so the PWA works offline. */
  readonly fonts: readonly string[];
  /** Prefix of every browser storage key, e.g. `makruk.`, so sites never read each other's data. */
  readonly storagePrefix: string;
}

export function isLocale<L extends string>(product: ProductConfig<L>, value: unknown): value is L {
  return typeof value === 'string' && (product.locales as readonly string[]).includes(value);
}

/** The value when it is one of the product's languages, otherwise the default language. */
export function resolveLocale<L extends string>(product: ProductConfig<L>, value: unknown): L {
  return isLocale(product, value) ? value : product.defaultLocale;
}

/** Reads `?lang=xx` from a URL search string when it names one of the product's languages. */
export function localeFromSearch<L extends string>(product: ProductConfig<L>, search: string): L | null {
  const lang = new URLSearchParams(search).get('lang');
  return isLocale(product, lang) ? lang : null;
}

export function storageKey(product: ProductConfig, name: string): string {
  return `${product.storagePrefix}${name}`;
}
