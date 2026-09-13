/** acct-002 sign-in (magic link, Google OAuth) and acct-003 account, ratings, history and replays. */
import {
  type AccountResponse,
  type AuthConfigResponse,
  type AuthResponse,
  type GameHistoryResponse,
  MagicLinkRequest,
  type PublicUser,
  TestLoginRequest,
} from '@makruk/protocol';
import type { Context, Hono } from 'hono';
import { decodeJwtPayload, randomToken, sha256Hex, signPayload, signToken, verifyPayload, verifyToken } from '../auth';
import type { Env } from '../env';
import { gameRecord, getRatings, getUser, historyFor, linkGuest, upsertUserByEmail, type UserRow } from './store';

type App = Hono<{ Bindings: Env }>;
type Ctx = Context<{ Bindings: Env }>;

const MAGIC_LINK_TTL_MS = 15 * 60_000;
const OAUTH_STATE_TTL_MS = 10 * 60_000;
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

const origin = (c: Ctx) => c.env.PUBLIC_ORIGIN ?? new URL(c.req.url).origin;
const googleEnabled = (env: Env) => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
const emailEnabled = (env: Env) => !!(env.RESEND_API_KEY && env.EMAIL_FROM);

async function currentUser(c: Ctx): Promise<PublicUser | null> {
  const header = c.req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : c.req.query('token');
  return token ? verifyToken(token, c.env.AUTH_SECRET) : null;
}

async function guestIdFrom(token: string | null | undefined, secret: string): Promise<string | null> {
  if (!token) return null;
  const user = await verifyToken(token, secret);
  return user?.kind === 'guest' ? user.id : null;
}

async function issue(c: Ctx, user: UserRow): Promise<AuthResponse> {
  const publicUser: PublicUser = { id: user.id, name: user.name, kind: 'user' };
  return { token: await signToken(publicUser, c.env.AUTH_SECRET), user: publicUser };
}

/** Sign-in finishes on the SPA, which reads the token from the URL fragment (never sent to servers). */
const finish = (c: Ctx, fragment: string) => c.redirect(`${origin(c)}/auth/complete#${fragment}`, 302);

function magicLinkEmail(link: string, thai: boolean): { subject: string; html: string } {
  const subject = thai ? 'ลิงก์เข้าสู่ระบบหมากรุกไทย' : 'Your Makruk sign-in link';
  const heading = thai ? 'เข้าสู่ระบบหมากรุกไทย' : 'Sign in to Makruk';
  const cta = thai ? 'เข้าสู่ระบบ' : 'Sign in';
  const note = thai ? 'ลิงก์นี้ใช้ได้ครั้งเดียวและหมดอายุใน 15 นาที' : 'This link works once and expires in 15 minutes.';
  return {
    subject,
    html: `<div style="font-family:sans-serif;max-width:420px;margin:auto;text-align:center">
<h1 style="color:#58cc02">${heading}</h1>
<p><a href="${link}" style="display:inline-block;background:#58cc02;color:#fff;padding:14px 28px;border-radius:16px;text-decoration:none;font-weight:bold">${cta}</a></p>
<p style="color:#777">${note}</p></div>`,
  };
}

export function registerAccountRoutes(app: App): void {
  app.get('/api/auth/config', (c) =>
    c.json({ google: googleEnabled(c.env), email: emailEnabled(c.env), testLogin: c.env.ALLOW_TEST_LOGIN === '1' } satisfies AuthConfigResponse),
  );

  /** Local development and E2E only: sign in as any email without a provider. */
  app.post('/api/auth/test-login', async (c) => {
    if (c.env.ALLOW_TEST_LOGIN !== '1') return c.json({ error: 'not_found' }, 404);
    const body = TestLoginRequest.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'bad_request' }, 400);
    const now = Date.now();
    const user = await upsertUserByEmail(c.env.DB, body.data.email.toLowerCase(), body.data.name, 'test', now);
    const guestId = await guestIdFrom(body.data.guestToken, c.env.AUTH_SECRET);
    if (guestId) await linkGuest(c.env.DB, guestId, user.id, now);
    return c.json(await issue(c, user));
  });

  app.post('/api/auth/magic-link', async (c) => {
    if (!emailEnabled(c.env)) return c.json({ error: 'email_disabled' }, 503);
    const body = MagicLinkRequest.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'bad_request' }, 400);
    const email = body.data.email.toLowerCase();
    const token = randomToken();
    await c.env.DB.prepare('INSERT INTO magic_links (token_hash, email, guest_id, expires_at) VALUES (?, ?, ?, ?)')
      .bind(await sha256Hex(token), email, await guestIdFrom(body.data.guestToken, c.env.AUTH_SECRET), Date.now() + MAGIC_LINK_TTL_MS)
      .run();
    const { subject, html } = magicLinkEmail(`${origin(c)}/api/auth/magic?token=${token}`, body.data.lang !== 'en');
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${c.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: c.env.EMAIL_FROM, to: [email], subject, html }),
    });
    if (!sent.ok) return c.json({ error: 'email_failed' }, 502);
    return c.json({ ok: true }, 202);
  });

  app.get('/api/auth/magic', async (c) => {
    const token = c.req.query('token');
    if (!token) return finish(c, 'error=invalid');
    const hash = await sha256Hex(token);
    const now = Date.now();
    const row = await c.env.DB.prepare('SELECT email, guest_id, expires_at, used_at FROM magic_links WHERE token_hash = ?')
      .bind(hash)
      .first<{ email: string; guest_id: string | null; expires_at: number; used_at: number | null }>();
    if (!row || row.used_at !== null || row.expires_at < now) return finish(c, 'error=expired');
    const claimed = await c.env.DB.prepare('UPDATE magic_links SET used_at = ? WHERE token_hash = ? AND used_at IS NULL').bind(now, hash).run();
    if (!claimed.meta.changes) return finish(c, 'error=expired');
    const user = await upsertUserByEmail(c.env.DB, row.email, row.email.split('@')[0]!.slice(0, 40), 'email', now);
    if (row.guest_id) await linkGuest(c.env.DB, row.guest_id, user.id, now);
    return finish(c, `token=${encodeURIComponent((await issue(c, user)).token)}`);
  });

  app.get('/api/auth/google/start', async (c) => {
    if (!googleEnabled(c.env)) return finish(c, 'error=google_disabled');
    const state = await signPayload(
      { nonce: randomToken(), guestId: await guestIdFrom(c.req.query('guest'), c.env.AUTH_SECRET), exp: Date.now() + OAUTH_STATE_TTL_MS },
      c.env.AUTH_SECRET,
    );
    const params = new URLSearchParams({
      client_id: c.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${origin(c)}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
  });

  app.get('/api/auth/google/callback', async (c) => {
    if (!googleEnabled(c.env)) return finish(c, 'error=google_disabled');
    const state = (await verifyPayload(c.req.query('state') ?? '', c.env.AUTH_SECRET)) as { guestId: string | null; exp: number } | null;
    const code = c.req.query('code');
    if (!state || typeof state.exp !== 'number' || state.exp < Date.now() || !code) return finish(c, 'error=state');

    const exchange = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID!,
        client_secret: c.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${origin(c)}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    if (!exchange.ok) return finish(c, 'error=google');
    const { id_token: idToken } = (await exchange.json()) as { id_token?: string };
    const claims = decodeJwtPayload(idToken);
    const email = typeof claims?.email === 'string' ? claims.email.toLowerCase() : null;
    const valid =
      claims &&
      email &&
      claims.aud === c.env.GOOGLE_CLIENT_ID &&
      GOOGLE_ISSUERS.includes(String(claims.iss)) &&
      claims.email_verified === true &&
      typeof claims.exp === 'number' &&
      claims.exp * 1000 > Date.now();
    if (!valid) return finish(c, 'error=google');

    const now = Date.now();
    const name = (typeof claims.name === 'string' && claims.name) || email.split('@')[0]!;
    const user = await upsertUserByEmail(c.env.DB, email, name.slice(0, 40), 'google', now);
    if (state.guestId) await linkGuest(c.env.DB, state.guestId, user.id, now);
    return finish(c, `token=${encodeURIComponent((await issue(c, user)).token)}`);
  });

  app.get('/api/account', async (c) => {
    const me = await currentUser(c);
    if (!me || me.kind !== 'user') return c.json({ error: 'unauthorized' }, 401);
    const row = await getUser(c.env.DB, me.id);
    if (!row) return c.json({ error: 'unauthorized' }, 401);
    return c.json({ user: me, email: row.email, ratings: await getRatings(c.env.DB, me.id) } satisfies AccountResponse);
  });

  app.get('/api/account/games', async (c) => {
    const me = await currentUser(c);
    if (!me) return c.json({ error: 'unauthorized' }, 401);
    return c.json({ games: await historyFor(c.env.DB, me) } satisfies GameHistoryResponse);
  });

  app.get('/api/games/record/:id', async (c) => {
    const record = await gameRecord(c.env.DB, c.req.param('id'), await currentUser(c));
    return record ? c.json(record) : c.json({ error: 'not_found' }, 404);
  });
}
