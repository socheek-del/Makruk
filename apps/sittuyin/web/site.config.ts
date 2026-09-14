/**
 * Public address of the Sittuyin site — the single place to change when the domain changes.
 *
 * The owner chose this subdomain on 2026-09-14 (sit-009); parent domains are temporary. Override without
 * editing: `SITTUYIN_SITE_URL=https://example.com npm run build`. The variable is named after the product
 * because sibling sites read this file too, to link here (plat-006, packages/family).
 * When moving domains also update `routes` in apps/sittuyin/worker/wrangler.jsonc.
 */
export const SITE_URL = (process.env.SITTUYIN_SITE_URL ?? 'https://my-chess.beanroti.com').replace(/\/+$/, '');
