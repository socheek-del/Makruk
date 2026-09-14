/**
 * acct-002: username + password accounts with email confirmation and password reset.
 * acct-003: account, ratings, history and replays.
 */
import {
  type AccountResponse,
  type AuthConfigResponse,
  type AuthErrorCode,
  type AuthResponse,
  type DevOutboxResponse,
  ForgotPasswordRequest,
  type GameHistoryResponse,
  LoginRequest,
  type PublicUser,
  RegisterRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
} from '@chaturanga/protocol';
import type { Context, Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { signToken, verifyToken } from '../auth';
import type { Env } from '../env';
import { emailAvailable, type Lang, renderEmail, sendEmail } from './email';
import { DUMMY_HASH, hashPassword, verifyPassword } from './password';
import {
  clearLoginFailures,
  consumeAuthToken,
  createAuthToken,
  createPasswordUser,
  findUserByLogin,
  gameRecord,
  getRatings,
  getUser,
  historyFor,
  linkGuest,
  markEmailVerified,
  recordLoginFailure,
  setPassword,
  type UserRow,
} from './store';

type App = Hono<{ Bindings: Env }>;
type Ctx = Context<{ Bindings: Env }>;

const VERIFY_TTL_MS = 24 * 60 * 60_000;
const RESET_TTL_MS = 60 * 60_000;

const origin = (c: Ctx) => c.env.PUBLIC_ORIGIN ?? new URL(c.req.url).origin;
const fail = (c: Ctx, error: AuthErrorCode, status: ContentfulStatusCode) => c.json({ error }, status);

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
  const publicUser: PublicUser = { id: user.id, name: user.username ?? user.name, kind: 'user' };
  return { token: await signToken(publicUser, c.env.AUTH_SECRET), user: publicUser };
}

async function body<T>(c: Ctx, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }) {
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  return parsed.success ? parsed.data : null;
}

async function sendVerification(c: Ctx, user: UserRow, lang: Lang, guestId: string | null): Promise<boolean> {
  const token = await createAuthToken(c.env.DB, { userId: user.id, purpose: 'verify', ttlMs: VERIFY_TTL_MS, guestId, now: Date.now() });
  return sendEmail(c.env, renderEmail('verify', user.email!, `${origin(c)}/api/auth/verify?token=${token}`, lang));
}

export function registerAccountRoutes(app: App): void {
  app.get('/api/auth/config', (c) =>
    c.json({ accounts: emailAvailable(c.env), devOutbox: c.env.DEV_EMAIL_OUTBOX === '1' } satisfies AuthConfigResponse),
  );

  app.post('/api/auth/register', async (c) => {
    if (!emailAvailable(c.env)) return fail(c, 'email_unavailable', 503);
    const input = await body(c, RegisterRequest);
    if (!input) return fail(c, 'bad_request', 400);
    const created = await createPasswordUser(c.env.DB, {
      username: input.username,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      now: Date.now(),
    });
    if (created === 'username_taken' || created === 'email_taken') return fail(c, created, 409);
    const sent = await sendVerification(c, created, input.lang ?? 'th', await guestIdFrom(input.guestToken, c.env.AUTH_SECRET));
    if (!sent) return fail(c, 'email_unavailable', 502);
    return c.json({ status: 'verification_sent' }, 201);
  });

  /** The confirmation link: activates the account and signs the user in. */
  app.get('/api/auth/verify', async (c) => {
    const token = c.req.query('token');
    const now = Date.now();
    const claim = token ? await consumeAuthToken(c.env.DB, token, 'verify', now) : null;
    if (!claim) return c.redirect(`${origin(c)}/auth/complete#error=invalid_token`, 302);
    await markEmailVerified(c.env.DB, claim.userId, now);
    if (claim.guestId) await linkGuest(c.env.DB, claim.guestId, claim.userId, now);
    const user = (await getUser(c.env.DB, claim.userId))!;
    return c.redirect(`${origin(c)}/auth/complete#token=${encodeURIComponent((await issue(c, user)).token)}`, 302);
  });

  app.post('/api/auth/resend-verification', async (c) => {
    const input = await body(c, ResendVerificationRequest);
    if (!input) return fail(c, 'bad_request', 400);
    const user = await findUserByLogin(c.env.DB, input.login);
    // Same response whether or not the account exists.
    if (user?.email && !user.email_verified_at && emailAvailable(c.env)) await sendVerification(c, user, input.lang ?? 'th', null);
    return c.json({ status: 'ok' }, 202);
  });

  app.post('/api/auth/login', async (c) => {
    const input = await body(c, LoginRequest);
    if (!input) return fail(c, 'bad_request', 400);
    const now = Date.now();
    const user = await findUserByLogin(c.env.DB, input.login);
    if (!user?.password_hash) {
      await verifyPassword(input.password, DUMMY_HASH); // equalize timing for unknown accounts
      return fail(c, 'invalid_credentials', 401);
    }
    if (user.locked_until && user.locked_until > now) return fail(c, 'locked', 429);
    if (!(await verifyPassword(input.password, user.password_hash))) {
      await recordLoginFailure(c.env.DB, user, now);
      return fail(c, 'invalid_credentials', 401);
    }
    if (!user.email_verified_at) return fail(c, 'email_not_verified', 403);
    await clearLoginFailures(c.env.DB, user.id);
    const guestId = await guestIdFrom(input.guestToken, c.env.AUTH_SECRET);
    if (guestId) await linkGuest(c.env.DB, guestId, user.id, now);
    return c.json(await issue(c, user));
  });

  app.post('/api/auth/forgot-password', async (c) => {
    const input = await body(c, ForgotPasswordRequest);
    if (!input) return fail(c, 'bad_request', 400);
    if (!emailAvailable(c.env)) return fail(c, 'email_unavailable', 503);
    const user = await findUserByLogin(c.env.DB, input.email);
    if (user?.email && user.password_hash) {
      const token = await createAuthToken(c.env.DB, { userId: user.id, purpose: 'reset', ttlMs: RESET_TTL_MS, now: Date.now() });
      await sendEmail(c.env, renderEmail('reset', user.email, `${origin(c)}/reset-password?token=${token}`, input.lang ?? 'th'));
    }
    // Same response whether or not the email has an account.
    return c.json({ status: 'ok' }, 202);
  });

  app.post('/api/auth/reset-password', async (c) => {
    const input = await body(c, ResetPasswordRequest);
    if (!input) return fail(c, 'bad_request', 400);
    const now = Date.now();
    const claim = await consumeAuthToken(c.env.DB, input.token, 'reset', now);
    if (!claim) return fail(c, 'invalid_token', 400);
    await setPassword(c.env.DB, claim.userId, await hashPassword(input.password), now);
    // Following the emailed link proves the address.
    await markEmailVerified(c.env.DB, claim.userId, now);
    return c.json(await issue(c, (await getUser(c.env.DB, claim.userId))!));
  });

  /** Development/test only: read emails that would have been sent. */
  app.get('/api/dev/outbox', async (c) => {
    if (c.env.DEV_EMAIL_OUTBOX !== '1') return c.json({ error: 'not_found' }, 404);
    const to = (c.req.query('to') ?? '').toLowerCase();
    const { results } = await c.env.DB.prepare(
      'SELECT to_email, subject, html, created_at FROM dev_outbox WHERE to_email = ? ORDER BY id DESC LIMIT 20',
    )
      .bind(to)
      .all<{ to_email: string; subject: string; html: string; created_at: number }>();
    return c.json({
      emails: results.map((r) => ({ to: r.to_email, subject: r.subject, html: r.html, createdAt: r.created_at })),
    } satisfies DevOutboxResponse);
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
