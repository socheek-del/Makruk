/**
 * seo-001: per-page title, description, canonical URL and language alternates. The app is a single-page
 * app, so these tags are updated on every navigation (search engines index the rendered page).
 */
import type { Language } from '../../stores/settings';

/** From site.config.ts (injected by Vite) — never hardcode the domain elsewhere. */
export const SITE_URL: string = __SITE_URL__;

export type SeoPage = 'home' | 'computer' | 'online' | 'room' | 'local' | 'learn' | 'about' | 'settings';

export interface PageSeo {
  page: SeoPage;
  /** Path without query, used for canonical and alternate URLs. */
  path: string;
  /** Private or throwaway pages (online rooms) should not be indexed. */
  index: boolean;
}

export function pageSeo(pathname: string): PageSeo {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return { page: 'home', path, index: true };
  if (path === '/play/computer') return { page: 'computer', path, index: true };
  if (path === '/play/online') return { page: 'online', path, index: true };
  if (path.startsWith('/play/online/')) return { page: 'room', path: '/play/online', index: false };
  if (path === '/play/local') return { page: 'local', path, index: true };
  if (path === '/learn' || path.startsWith('/learn/') || path === '/play/guided') return { page: 'learn', path: '/learn', index: path === '/learn' };
  if (path === '/about') return { page: 'about', path, index: true };
  if (path === '/settings') return { page: 'settings', path, index: false };
  return { page: 'home', path: '/', index: false };
}

/** Thai pages live at the plain URL (the default language); English at `?lang=en`. */
export function localizedUrl(path: string, language: Language): string {
  return `${SITE_URL}${path}${language === 'en' ? '?lang=en' : ''}`;
}

/** Reads `?lang=th|en` from a URL search string. */
export function languageFromSearch(search: string): Language | null {
  const lang = new URLSearchParams(search).get('lang');
  return lang === 'th' || lang === 'en' ? lang : null;
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

export function applySeo(seo: PageSeo, language: Language, title: string, description: string): void {
  document.title = title;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', seo.index ? 'index, follow' : 'noindex, follow');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', localizedUrl(seo.path, language));
  setMeta('property', 'og:locale', language === 'en' ? 'en_US' : 'th_TH');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setLink('link[rel="canonical"]', { rel: 'canonical', href: localizedUrl(seo.path, language) });
  setLink('link[rel="alternate"][hreflang="th"]', { rel: 'alternate', hreflang: 'th', href: localizedUrl(seo.path, 'th') });
  setLink('link[rel="alternate"][hreflang="en"]', { rel: 'alternate', hreflang: 'en', href: localizedUrl(seo.path, 'en') });
  setLink('link[rel="alternate"][hreflang="x-default"]', { rel: 'alternate', hreflang: 'x-default', href: localizedUrl(seo.path, 'th') });
}
