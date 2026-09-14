/**
 * Per-page title, description, canonical URL and language alternates. The sites are single-page apps, so the
 * tags are rewritten on every navigation (search engines index the rendered page).
 */
import type { ProductConfig } from './product';

export interface SeoTarget {
  /** Path without query, used for canonical and alternate URLs. */
  path: string;
  /** Private or throwaway pages (online rooms) should not be indexed. */
  index: boolean;
}

/** The default language lives at the plain URL; every other language at `?lang=xx`. */
export function localizedUrl<L extends string>(product: ProductConfig<L>, siteUrl: string, path: string, locale: L): string {
  return `${siteUrl}${path}${locale === product.defaultLocale ? '' : `?lang=${locale}`}`;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(selector: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

export function applySeo<L extends string>(
  product: ProductConfig<L>,
  siteUrl: string,
  seo: SeoTarget,
  locale: L,
  title: string,
  description: string,
): void {
  const url = (l: L) => localizedUrl(product, siteUrl, seo.path, l);
  document.title = title;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', seo.index ? 'index, follow' : 'noindex, follow');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url(locale));
  setMeta('property', 'og:locale', product.ogLocales[locale]);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setLink('link[rel="canonical"]', { rel: 'canonical', href: url(locale) });
  for (const l of product.locales) {
    setLink(`link[rel="alternate"][hreflang="${l}"]`, { rel: 'alternate', hreflang: l, href: url(l) });
  }
  setLink('link[rel="alternate"][hreflang="x-default"]', { rel: 'alternate', hreflang: 'x-default', href: url(product.defaultLocale) });
}
