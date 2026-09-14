import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { applySeo, pageSeo } from './seo';

/** Keeps the document title, description, canonical URL and hreflang links in sync with the page and language. */
export function SeoController() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const language = i18n.language === 'en' ? 'en' : 'th';

  useEffect(() => {
    const seo = pageSeo(pathname);
    applySeo(seo, language, t(`seo.${seo.page}.title`), t(`seo.${seo.page}.description`));
  }, [pathname, language, t]);

  return null;
}
