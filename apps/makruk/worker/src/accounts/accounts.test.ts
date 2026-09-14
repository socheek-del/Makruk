import {
  AccountResponse,
  AuthConfigResponse,
  AuthResponse,
  DevOutboxResponse,
  GameHistoryResponse,
  GameRecordResponse,
  GuestResponse,
  ServerMessage,
  type TimeControl,
} from '@chaturanga/protocol';
import { env as providedEnv, exports as providedExports } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../env';
import { renderEmail, sendEmail } from './email';
import { hashPassword, verifyPassword } from './password';
import { recordGame } from './store';

const env = providedEnv as unknown as Env;
const worker = providedExports as unknown as {
  default: { fetch: (input: string, init?: RequestInit) => Promise<Response> };
};
const BASE = 'https://th-chess.test';
const PASSWORD = 'correct horse battery';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const post = (body: unknown, token?: string): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
});
const bearer = (token: string): RequestInit => ({ headers: { authorization: `Bearer ${token}` } });
let counter = 0;
const uniqueName = (base: string) => `${base}_${Date.now() % 100000}${counter++}`.slice(0, 20);

afterEach(() => {
  vi.restoreAllMocks();
});

const api = (path: string, init?: RequestInit) => worker.default.fetch(`${BASE}${path}`, init);

async function guest() {
  return GuestResponse.parse(await (await api('/api/guest', { method: 'POST' })).json());
}

async function outbox(email: string) {
  return DevOutboxResponse.parse(await (await api(`/api/dev/outbox?to=${encodeURIComponent(email)}`)).json()).emails;
}

const linkIn = (html: string) => /href="([^"]+)"/.exec(html)![1]!;

async function register(username: string, options: { email?: string; password?: string; guestToken?: string; lang?: 'th' | 'en' } = {}) {
  const email = options.email ?? `${username.toLowerCase()}@example.test`;
  const res = await api('/api/auth/register', post({ username, email, password: options.password ?? PASSWORD, guestToken: options.guestToken, lang: options.lang }));
  return { res, email };
}

/** Follows the confirmation link and returns the signed-in token. */
async function confirm(email: string) {
  const [latest] = await outbox(email);
  const follow = await worker.default.fetch(linkIn(latest!.html), { redirect: 'manual' });
  const location = follow.headers.get('location')!;
  expect(location.startsWith(`${BASE}/auth/complete#token=`)).toBe(true);
  return decodeURIComponent(location.split('#token=')[1]!);
}

async function signUp(base: string, guestToken?: string) {
  const username = uniqueName(base);
  const { res, email } = await register(username, { guestToken });
  expect(res.status).toBe(201);
  const token = await confirm(email);
  return { token, username, email, user: (await account(token)).user };
}

const login = (loginName: string, password: string, guestToken?: string) => api('/api/auth/login', post({ login: loginName, password, guestToken }));

async function account(token: string) {
  return AccountResponse.parse(await (await api('/api/account', bearer(token))).json());
}

async function history(token: string) {
  return GameHistoryResponse.parse(await (await api('/api/account/games', bearer(token))).json()).games;
}

async function connect(code: string, token: string) {
  const res = await api(`/ws/game/${code}?token=${encodeURIComponent(token)}`, { headers: { Upgrade: 'websocket' } });
  const ws = res.webSocket!;
  const inbox: ServerMessage[] = [];
  ws.accept();
  ws.addEventListener('message', (event: MessageEvent) => inbox.push(ServerMessage.parse(JSON.parse(event.data as string))));
  const until = async (predicate: (m: ServerMessage) => boolean) => {
    for (let i = 0; i < 300; i++) {
      if (inbox.some(predicate)) return;
      await sleep(10);
    }
    throw new Error(`timed out: ${JSON.stringify(inbox.at(-1))}`);
  };
  return { send: (m: unknown) => ws.send(JSON.stringify(m)), until };
}

/** White plays e3e4, Black d6d5, then `loser` resigns. Returns the room code. */
async function playAndResign(
  whiteToken: string,
  blackToken: string,
  options: { rated?: boolean; timeControl?: TimeControl | null; loser?: 'w' | 'b' } = {},
) {
  const created = await api(
    '/api/games',
    post({ color: 'w', rated: options.rated ?? true, timeControl: options.timeControl === undefined ? { initialMs: 300_000, incrementMs: 0 } : options.timeControl }, whiteToken),
  );
  const { code } = (await created.json()) as { code: string };
  const white = await connect(code, whiteToken);
  const black = await connect(code, blackToken);
  const playing = (m: ServerMessage) => m.type === 'state' && m.game.status === 'playing';
  await white.until(playing);
  await black.until(playing);
  white.send({ type: 'move', uci: 'e3e4', ply: 0 });
  await black.until((m) => m.type === 'state' && m.game.moves.length === 1);
  black.send({ type: 'move', uci: 'd6d5', ply: 1 });
  await white.until((m) => m.type === 'state' && m.game.moves.length === 2);
  (options.loser === 'b' ? black : white).send({ type: 'resign' });
  await black.until((m) => m.type === 'state' && m.game.status === 'finished');
  return code;
}

describe('passwords', () => {
  it('hashes with a random salt and verifies only the right password', async () => {
    const a = await hashPassword('s3cret-pass');
    const b = await hashPassword('s3cret-pass');
    expect(a).not.toBe(b);
    expect(a.startsWith('pbkdf2-sha256$100000$')).toBe(true);
    expect(await verifyPassword('s3cret-pass', a)).toBe(true);
    expect(await verifyPassword('wrong-pass', a)).toBe(false);
    expect(await verifyPassword('s3cret-pass', 'md5$garbage')).toBe(false);
  });
});

describe('registration and email confirmation (acct-002)', () => {
  it('reports that accounts are available', async () => {
    expect(AuthConfigResponse.parse(await (await api('/api/auth/config')).json())).toEqual({ accounts: true, devOutbox: true });
  });

  it('registers, requires email confirmation before sign-in, and confirms with a one-time link', async () => {
    const username = uniqueName('Somchai');
    const { res, email } = await register(username, { lang: 'th' });
    expect(res.status).toBe(201);

    const [mail] = await outbox(email);
    expect(mail!.subject).toBe('ยืนยันอีเมลสำหรับบัญชีหมากรุกไทย');
    expect(linkIn(mail!.html).startsWith(`${BASE}/api/auth/verify?token=`)).toBe(true);

    const early = await login(username, PASSWORD);
    expect(early.status).toBe(403);
    expect(await early.json()).toEqual({ error: 'email_not_verified' });

    const token = await confirm(email);
    const me = await account(token);
    expect(me.user).toMatchObject({ name: username, kind: 'user' });
    expect(me.email).toBe(email);

    const reuse = await worker.default.fetch(linkIn(mail!.html), { redirect: 'manual' });
    expect(reuse.headers.get('location')).toBe(`${BASE}/auth/complete#error=invalid_token`);
  });

  it('resends the confirmation email for an unconfirmed account', async () => {
    const username = uniqueName('Resend');
    const { email } = await register(username);
    expect((await api('/api/auth/resend-verification', post({ login: username }))).status).toBe(202);
    expect(await outbox(email)).toHaveLength(2);
    expect((await api('/api/auth/resend-verification', post({ login: 'nobody_here' }))).status).toBe(202);
  });

  it('rejects taken usernames and emails, bad usernames and short passwords', async () => {
    const username = uniqueName('Taken');
    await register(username);
    expect(await (await register(username.toUpperCase(), { email: `other${counter}@example.test` })).res.json()).toEqual({ error: 'username_taken' });
    expect(await (await register(uniqueName('Other'), { email: `${username.toLowerCase()}@example.test` })).res.json()).toEqual({ error: 'email_taken' });
    expect((await register('no spaces!')).res.status).toBe(400);
    expect((await register(uniqueName('Short'), { password: 'short' })).res.status).toBe(400);
  });
});

describe('sign-in (acct-002)', () => {
  it('signs in with username (any case) or email; wrong passwords are rejected', async () => {
    const { username, email } = await signUp('Nok');
    for (const name of [username, username.toUpperCase(), email]) {
      const res = await login(name, PASSWORD);
      expect(res.status).toBe(200);
      expect(AuthResponse.parse(await res.json()).user.name).toBe(username);
    }
    const wrong = await login(username, 'not the password');
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual({ error: 'invalid_credentials' });
    expect((await login('ghost_user', PASSWORD)).status).toBe(401);
  });

  it('locks the account after 10 failed attempts', async () => {
    const { username } = await signUp('Locky');
    for (let i = 0; i < 10; i++) expect((await login(username, `wrong-${i}-password`)).status).toBe(401);
    const locked = await login(username, PASSWORD);
    expect(locked.status).toBe(429);
    expect(await locked.json()).toEqual({ error: 'locked' });
  });
});

describe('password reset (acct-002)', () => {
  it('emails a reset link; the new password works, the old one and the link do not', async () => {
    const { username, email } = await signUp('Reset');
    expect((await api('/api/auth/forgot-password', post({ email: 'nobody@example.test' }))).status).toBe(202);
    expect(await outbox('nobody@example.test')).toHaveLength(0);

    expect((await api('/api/auth/forgot-password', post({ email, lang: 'en' }))).status).toBe(202);
    const [mail] = await outbox(email);
    expect(mail!.subject).toBe('Reset your Makruk password');
    const link = new URL(linkIn(mail!.html));
    expect(link.pathname).toBe('/reset-password');
    const token = link.searchParams.get('token')!;

    const reset = await api('/api/auth/reset-password', post({ token, password: 'brand new password' }));
    expect(reset.status).toBe(200);
    expect(AuthResponse.parse(await reset.json()).user.name).toBe(username);

    expect((await login(username, PASSWORD)).status).toBe(401);
    expect((await login(username, 'brand new password')).status).toBe(200);
    const again = await api('/api/auth/reset-password', post({ token, password: 'another password' }));
    expect(await again.json()).toEqual({ error: 'invalid_token' });
  });

  it('delivers real email through Resend when configured', async () => {
    const calls: Array<{ url: string; body: { to: string[]; subject: string } }> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      calls.push({ url: String(input), body: JSON.parse(String(init?.body)) });
      return new Response('{"id":"1"}', { status: 200 });
    });
    const configured = { ...env, RESEND_API_KEY: 'key', EMAIL_FROM: 'Makruk <noreply@beanroti.com>', DEV_EMAIL_OUTBOX: undefined };
    expect(await sendEmail(configured, renderEmail('verify', 'a@example.test', 'https://x/verify', 'en'))).toBe(true);
    expect(calls).toEqual([{ url: 'https://api.resend.com/emails', body: expect.objectContaining({ to: ['a@example.test'], subject: 'Confirm your Makruk account' }) }]);
    expect(await sendEmail({ ...env, DEV_EMAIL_OUTBOX: undefined }, renderEmail('reset', 'a@example.test', 'https://x', 'th'))).toBe(false);
  });
});

describe('ratings and history (acct-003)', () => {
  it('a rated game between signed-in players updates both ratings and appears in both histories', async () => {
    const white = await signUp('White');
    const black = await signUp('Black');
    const code = await playAndResign(white.token, black.token);

    const whiteBlitz = (await account(white.token)).ratings.find((r) => r.timeClass === 'blitz')!;
    const blackBlitz = (await account(black.token)).ratings.find((r) => r.timeClass === 'blitz')!;
    expect(whiteBlitz.rating).toBeLessThan(1500);
    expect(blackBlitz.rating).toBeGreaterThan(1500);
    expect([whiteBlitz.games, blackBlitz.games]).toEqual([1, 1]);

    const [game] = await history(white.token);
    expect(game).toMatchObject({ code, rated: true, yourColor: 'w', timeClass: 'blitz', moveCount: 2, result: { winner: 'b', reason: 'resign' } });
    expect(game!.ratingChange).toBeLessThan(0);
    expect((await history(black.token))[0]!.ratingChange).toBeGreaterThan(0);

    const record = GameRecordResponse.parse(await (await api(`/api/games/record/${game!.id}`)).json());
    expect(record.moves).toEqual(['e3e4', 'd6d5']);
    expect(record.timeControl).toEqual({ initialMs: 300_000, incrementMs: 0 });
  });

  it('casual games, untimed games and games with a guest do not change ratings', async () => {
    const a = await signUp('Casual');
    const b = await signUp('Friend');
    await playAndResign(a.token, b.token, { rated: false });
    await playAndResign(a.token, b.token, { timeControl: null });
    const visitor = await guest();
    await playAndResign(a.token, visitor.token);

    const ratings = (await account(a.token)).ratings;
    expect(ratings.every((r) => r.rating === 1500 && r.games === 0)).toBe(true);
    const games = await history(a.token);
    expect(games).toHaveLength(3);
    expect(games.every((g) => !g.rated && g.ratingChange === null)).toBe(true);
  });

  it('a guest who registers keeps their earlier games; signing in from a guest links that guest too', async () => {
    const visitor = await guest();
    const rival = await guest();
    await playAndResign(visitor.token, rival.token, { loser: 'b' });
    const member = await signUp('Member', visitor.token);
    const games = await history(member.token);
    expect(games).toHaveLength(1);
    expect(games[0]).toMatchObject({ yourColor: 'w', result: { winner: 'w' } });

    const secondDevice = await guest();
    await playAndResign(rival.token, secondDevice.token, { loser: 'w' });
    const signedIn = AuthResponse.parse(await (await login(member.username, PASSWORD, secondDevice.token)).json());
    expect(await history(signedIn.token)).toHaveLength(2);
  });

  it('recording the same finished game twice applies ratings once', async () => {
    const white = await signUp('Twice');
    const black = await signUp('Again');
    const game = {
      id: `ONCE23-${Date.now()}`,
      code: 'ONCE23',
      white: white.user,
      black: black.user,
      startFen: 'rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1',
      moves: ['e3e4', 'd6d5'],
      timeControl: { initialMs: 180_000, incrementMs: 2_000 },
      result: { winner: 'w' as const, reason: 'resign' as const },
      rated: true,
      finishedAt: Date.now(),
    };
    expect(await recordGame(env.DB, game)).toEqual({ inserted: true, rated: true });
    expect(await recordGame(env.DB, game)).toEqual({ inserted: false, rated: true });
    expect((await account(white.token)).ratings.find((r) => r.timeClass === 'blitz')!.games).toBe(1);
  });
});
