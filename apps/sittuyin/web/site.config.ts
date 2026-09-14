/**
 * Public address of the Sittuyin site — the single place to change when the domain changes.
 *
 * The subdomain is an owner decision (sit-009) and is deliberately not final here. Override without
 * editing: `SITTUYIN_SITE_URL=https://example.com npm run build`. The variable is named after the product
 * because sibling sites read this file too, to link here (plat-006, packages/family).
 */
export const SITE_URL = (process.env.SITTUYIN_SITE_URL ?? 'https://my-chess.beanroti.com').replace(/\/+$/, '');
