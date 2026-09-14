/**
 * Public address of the site — the single place to change when the domain changes.
 *
 * Used for canonical URLs, language alternates, Open Graph tags, JSON-LD, robots.txt and sitemap.xml.
 * Override without editing: `MAKRUK_SITE_URL=https://example.com npm run build`. The variable is named after
 * the product because sibling sites read this file too, to link here (plat-006, packages/family).
 * When moving domains also update `apps/makruk/worker/wrangler.jsonc` (`routes`, `PUBLIC_ORIGIN`) and the `[play]`
 * link at the bottom of apps/makruk/README.md / README.th.md, then resubmit the sitemap in Google Search Console.
 */
export const SITE_URL = (process.env.MAKRUK_SITE_URL ?? 'https://th-chess.beanroti.com').replace(/\/+$/, '');
