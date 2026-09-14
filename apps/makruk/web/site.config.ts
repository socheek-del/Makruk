/**
 * Public address of the site — the single place to change when the domain changes.
 *
 * Used for canonical URLs, language alternates, Open Graph tags, JSON-LD, robots.txt and sitemap.xml.
 * Override without editing: `SITE_URL=https://example.com npm run build`.
 * When moving domains also update `apps/makruk/worker/wrangler.jsonc` (`routes`, `PUBLIC_ORIGIN`) and the `[play]`
 * link at the bottom of apps/makruk/README.md / README.th.md, then resubmit the sitemap in Google Search Console.
 */
export const SITE_URL = (process.env.SITE_URL ?? 'https://th-chess.beanroti.com').replace(/\/+$/, '');
