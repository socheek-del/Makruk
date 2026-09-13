import {
  AccountResponse,
  AuthConfigResponse,
  AuthResponse,
  GameHistoryResponse,
  GameRecordResponse,
  GuestResponse,
  ServerMessage,
  type TimeControl,
} from '@makruk/protocol';
import { env as providedEnv, exports as providedExports } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../env';
import { recordGame } from './store';

const env = providedEnv as unknown as Env;
const worker = providedExports as unknown as {
  default: { fetch: (input: string, init?: RequestInit) => Promise<Response> };
};
const BASE = 'https://th-chess.test';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const post = (body: unknown, token?: string): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
});
const bearer = (token: string): RequestInit => ({ headers: { authorization: `Bearer ${token}` } });
let emails = 0;
const uniqueEmail = (name: string) => `${name}-${Date.now()}-${emails++}@example.test`;

afterEach(() => {
  vi.restoreAllMocks();
});

async function guest() {
  return GuestResponse.parse(await (await worker.default.fetch(`${BASE}/api/guest`, { method: 'POST' })).json());
}

async function testLogin(name: string, email = uniqueEmail(name), guestToken?: string) {
  const res = await worker.default.fetch(`${BASE}/api/auth/test-login`, post({ name, email, guestToken }));
  expect(res.status).toBe(200);
  return AuthResponse.parse(await res.json());
}

async function account(token: string) {
  return AccountResponse.parse(await (await worker.default.fetch(`${BASE}/api/account`, bearer(token))).json());
}

async function history(token: string) {
  return GameHistoryResponse.parse(await (await worker.default.fetch(`${BASE}/api/account/games`, bearer(token))).json()).games;
}

async function connect(code: string, token: string) {
  const res = await worker.default.fetch(`${BASE}/ws/game/${code}?token=${encodeURIComponent(token)}`, { headers: { Upgrade: 'websocket' } });
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
  const created = await worker.default.fetch(
    `${BASE}/api/games`,
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

describe('sign-in (acct-002)', () => {
  it('reports which providers are configured', async () => {
    const config = AuthConfigResponse.parse(await (await worker.default.fetch(`${BASE}/api/auth/config`)).json());
    expect(config).toEqual({ google: true, email: true, testLogin: true });
  });

  it('test sign-in creates one account per email with default provisional ratings', async () => {
    const email = uniqueEmail('dao');
    const first = await testLogin('Dao', email);
    const again = await testLogin('Dao', email);
    expect(first.user).toEqual(again.user);
    expect(first.user.kind).toBe('user');
    const me = await account(first.token);
    expect(me.email).toBe(email);
    expect(me.ratings.map((r) => [r.timeClass, r.rating, r.provisional])).toEqual([
      ['bullet', 1500, true],
      ['blitz', 1500, true],
      ['rapid', 1500, true],
      ['classical', 1500, true],
    ]);
  });

  it('magic link: emails a one-time link that signs the user in and keeps guest games', async () => {
    const visitor = await guest();
    const rival = await guest();
    await playAndResign(rival.token, visitor.token, { rated: false });

    const sent: Array<{ to: string[]; subject: string; html: string }> = [];
    const realFetch = globalThis.fetch;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (String(input).startsWith('https://api.resend.com/emails')) {
        expect(new Headers(init?.headers).get('authorization')).toBe('Bearer test-resend-key');
        sent.push(JSON.parse(String(init?.body)));
        return new Response('{"id":"email_1"}', { status: 200 });
      }
      return realFetch(input, init);
    });

    const email = uniqueEmail('nok');
    const request = await worker.default.fetch(`${BASE}/api/auth/magic-link`, post({ email, guestToken: visitor.token, lang: 'th' }));
    expect(request.status).toBe(202);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.to).toEqual([email]);
    expect(sent[0]!.subject).toBe('ลิงก์เข้าสู่ระบบหมากรุกไทย');
    const link = /href="([^"]+)"/.exec(sent[0]!.html)![1]!;
    expect(link.startsWith(`${BASE}/api/auth/magic?token=`)).toBe(true);

    const follow = await worker.default.fetch(link, { redirect: 'manual' });
    expect(follow.status).toBe(302);
    const location = follow.headers.get('location')!;
    expect(location.startsWith(`${BASE}/auth/complete#token=`)).toBe(true);
    const token = decodeURIComponent(location.split('#token=')[1]!);
    expect((await account(token)).email).toBe(email);
    expect((await history(token)).map((g) => g.yourColor)).toEqual(['b']);

    const reuse = await worker.default.fetch(link, { redirect: 'manual' });
    expect(reuse.headers.get('location')).toBe(`${BASE}/auth/complete#error=expired`);
  });

  it('Google: redirects to Google and signs in from a verified ID token', async () => {
    const start = await worker.default.fetch(`${BASE}/api/auth/google/start`, { redirect: 'manual' });
    expect(start.status).toBe(302);
    const google = new URL(start.headers.get('location')!);
    expect(google.origin + google.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(google.searchParams.get('client_id')).toBe('test-google-client');
    expect(google.searchParams.get('redirect_uri')).toBe(`${BASE}/api/auth/google/callback`);
    const state = google.searchParams.get('state')!;

    const email = uniqueEmail('somchai');
    const idToken = (claims: Record<string, unknown>) =>
      `e30.${btoa(JSON.stringify(claims)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.sig`;
    const realFetch = globalThis.fetch;
    let audience = 'test-google-client';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      if (String(input) === 'https://oauth2.googleapis.com/token') {
        const form = new URLSearchParams(String(init?.body));
        expect(form.get('client_secret')).toBe('test-google-secret');
        expect(form.get('code')).toBe('auth-code');
        const claims = { iss: 'https://accounts.google.com', aud: audience, email, email_verified: true, name: 'Somchai', exp: Math.floor(Date.now() / 1000) + 600 };
        return Response.json({ id_token: idToken(claims) });
      }
      return realFetch(input, init);
    });

    const callback = await worker.default.fetch(`${BASE}/api/auth/google/callback?code=auth-code&state=${encodeURIComponent(state)}`, { redirect: 'manual' });
    const location = callback.headers.get('location')!;
    expect(location.startsWith(`${BASE}/auth/complete#token=`)).toBe(true);
    const me = await account(decodeURIComponent(location.split('#token=')[1]!));
    expect(me.user.name).toBe('Somchai');
    expect(me.email).toBe(email);

    audience = 'someone-else';
    const wrongAudience = await worker.default.fetch(`${BASE}/api/auth/google/callback?code=auth-code&state=${encodeURIComponent(state)}`, { redirect: 'manual' });
    expect(wrongAudience.headers.get('location')).toBe(`${BASE}/auth/complete#error=google`);
    const badState = await worker.default.fetch(`${BASE}/api/auth/google/callback?code=auth-code&state=forged`, { redirect: 'manual' });
    expect(badState.headers.get('location')).toBe(`${BASE}/auth/complete#error=state`);
  });
});

describe('ratings and history (acct-003)', () => {
  it('a rated game between signed-in players updates both ratings and appears in both histories', async () => {
    const white = await testLogin('White');
    const black = await testLogin('Black');
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

    const record = GameRecordResponse.parse(await (await worker.default.fetch(`${BASE}/api/games/record/${game!.id}`)).json());
    expect(record.moves).toEqual(['e3e4', 'd6d5']);
    expect(record.timeControl).toEqual({ initialMs: 300_000, incrementMs: 0 });
  });

  it('casual games, untimed games and games with a guest do not change ratings', async () => {
    const a = await testLogin('Casual');
    const b = await testLogin('Friend');
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

  it('a guest who signs in keeps their earlier games', async () => {
    const visitor = await guest();
    const rival = await guest();
    await playAndResign(visitor.token, rival.token, { loser: 'b' });
    expect(await history(visitor.token)).toHaveLength(1);

    const member = await testLogin('Member', undefined, visitor.token);
    const games = await history(member.token);
    expect(games).toHaveLength(1);
    expect(games[0]).toMatchObject({ yourColor: 'w', result: { winner: 'w' } });
  });

  it('recording the same finished game twice applies ratings once', async () => {
    const white = await testLogin('Twice');
    const black = await testLogin('Again');
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
