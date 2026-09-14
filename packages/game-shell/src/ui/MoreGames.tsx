import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** A sibling site, as `@chaturanga/family` describes it (the shell does not depend on that package). */
export interface SiblingSite {
  id: string;
  names: Readonly<Record<string, string>>;
  /** Address without a trailing slash. */
  url: string;
  locales: readonly string[];
  defaultLocale: string;
}

export interface MoreGamesProps {
  sites: readonly SiblingSite[];
  /** The linking site's current language. */
  locale: string;
  /** `section` for the home page, `footer` for a line under every page. */
  variant?: 'section' | 'footer';
}

/** The sibling's address in the viewer's language when that site speaks it, else its default language. */
export function siblingHref(site: SiblingSite, locale: string): string {
  const speaks = locale !== site.defaultLocale && site.locales.includes(locale);
  return `${site.url}/${speaks ? `?lang=${locale}` : ''}`;
}

/**
 * plat-006: the only place one family game points at another. It shows each sibling's name in the
 * current language and links to its own site; no content is shared between the products.
 */
export function MoreGames({ sites, locale, variant = 'section' }: MoreGamesProps) {
  const { t } = useTranslation();
  if (sites.length === 0) return null;
  const name = (site: SiblingSite) => site.names[locale] ?? site.names.en ?? site.id;

  if (variant === 'footer') {
    return (
      <footer data-testid="family-footer" className="mt-12 text-center text-sm text-muted">
        {t('family.title')}:{' '}
        {sites.map((site, i) => (
          <span key={site.id}>
            {i > 0 && ' · '}
            <a href={siblingHref(site, locale)} className="font-semibold text-primary hover:underline">
              {name(site)}
            </a>
          </span>
        ))}
      </footer>
    );
  }

  return (
    <section aria-labelledby="more-games-heading" data-testid="more-games" className="flex flex-col gap-3">
      <h2 id="more-games-heading" className="text-xl font-bold">
        {t('family.title')}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {sites.map((site) => (
          <li key={site.id}>
            <a
              href={siblingHref(site, locale)}
              className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-line bg-surface p-4 font-semibold shadow-card transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              {name(site)}
              <ArrowUpRight aria-hidden className="h-5 w-5 shrink-0 text-muted" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
