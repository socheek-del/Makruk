/** robots.txt and sitemap.xml, generated from the configured site address at build time (see site.config.ts). */

/** Public, indexable pages; each is listed in Thai (plain URL) and English (`?lang=en`). */
export const INDEXED_PAGES: ReadonlyArray<{ path: string; priority: number }> = [
  { path: '/', priority: 1.0 },
  { path: '/play/computer', priority: 0.9 },
  { path: '/play/online', priority: 0.9 },
  { path: '/learn', priority: 0.8 },
  { path: '/play/local', priority: 0.7 },
  { path: '/about', priority: 0.5 },
];

export function buildRobots(siteUrl: string): string {
  return ['User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /ws/', 'Disallow: /design', '', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n');
}

export function buildSitemap(siteUrl: string): string {
  const url = (path: string, lang: 'th' | 'en') => `${siteUrl}${path}${lang === 'en' ? '?lang=en' : ''}`;
  const entries = INDEXED_PAGES.flatMap(({ path, priority }) =>
    (['th', 'en'] as const).map(
      (lang) => `  <url>
    <loc>${url(path, lang)}</loc>
    <xhtml:link rel="alternate" hreflang="th" href="${url(path, 'th')}" />
    <xhtml:link rel="alternate" hreflang="en" href="${url(path, 'en')}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${url(path, 'th')}" />
    <priority>${priority.toFixed(1)}</priority>
  </url>`,
    ),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
}
