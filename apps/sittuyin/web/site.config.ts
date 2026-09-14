/**
 * Public address of the Sittuyin site — the single place to change when the domain changes.
 *
 * The subdomain is an owner decision (sit-009) and is deliberately not final here. Override without
 * editing: `SITE_URL=https://example.com npm run build`.
 */
export const SITE_URL = (process.env.SITE_URL ?? 'https://my-chess.beanroti.com').replace(/\/+$/, '');
