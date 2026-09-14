import { type GameSnapshot, GuestResponse, RoomSummary, ServerMessage, type TimeControl } from '@chaturanga/protocol';
import { evictDurableObject, runDurableObjectAlarm } from 'cloudflare:test';
import { env as providedEnv, exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';

// The test runtime's env/exports are untyped without `wrangler types`; narrow them to our Worker.
const env = providedEnv as unknown as Env;
const exports = providedExports as unknown as { default: { fetch: (input: string, init?: RequestInit) => Promise<Response> } };

const BASE = 'https://th-chess.test';

async function guest() {
  const res = await exports.default.fetch(`${BASE}/api/guest`, { method: 'POST' });
  expect(res.status).toBe(200);
  return GuestResponse.parse(await res.json());
}

async function createGame(token: string, timeControl: TimeControl | null = { initialMs: 300_000, incrementMs: 0 }) {
  const res = await exports.default.fetch(`${BASE}/api/games`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ color: 'w', timeControl }),
  });
  expect(res.status).toBe(201);
  return ((await res.json()) as { code: string }).code;
}

const stubFor = (code: string) => env.GAME_ROOM.get(env.GAME_ROOM.idFromName(code));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type StateMessage = Extract<ServerMessage, { type: 'state' }>;

interface Client {
  ws: WebSocket;
  send: (message: unknown) => void;
  next: (predicate: (m: ServerMessage) => boolean, timeoutMs?: number) => Promise<ServerMessage>;
  state: (predicate: (game: GameSnapshot, you: StateMessage['you']) => boolean) => Promise<StateMessage>;
}

async function connect(code: string, token: string): Promise<Client> {
  const res = await exports.default.fetch(`${BASE}/ws/game/${code}?token=${encodeURIComponent(token)}`, {
    headers: { Upgrade: 'websocket' },
  });
  expect(res.status).toBe(101);
  const ws = res.webSocket!;
  const inbox: ServerMessage[] = [];
  let cursor = 0;
  ws.accept();
  ws.addEventListener('message', (event: MessageEvent) => inbox.push(ServerMessage.parse(JSON.parse(event.data as string))));

  const next: Client['next'] = async (predicate, timeoutMs = 3_000) => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      for (let i = cursor; i < inbox.length; i++) {
        if (predicate(inbox[i]!)) {
          cursor = i + 1;
          return inbox[i]!;
        }
      }
      if (Date.now() > deadline) throw new Error(`timed out waiting; unread: ${JSON.stringify(inbox.slice(cursor))}`);
      await sleep(10);
    }
  };

  return {
    ws,
    send: (message) => ws.send(JSON.stringify(message)),
    next,
    state: (predicate) => next((m) => m.type === 'state' && predicate(m.game, m.you)) as Promise<StateMessage>,
  };
}

async function startedGame(timeControl?: TimeControl | null) {
  const alice = await guest();
  const bob = await guest();
  const code = await createGame(alice.token, timeControl);
  const white = await connect(code, alice.token);
  await white.state((g, you) => g.status === 'waiting' && you === 'w');
  const black = await connect(code, bob.token);
  await black.state((g, you) => g.status === 'playing' && you === 'b');
  await white.state((g) => g.status === 'playing');
  return { alice, bob, code, white, black };
}

describe('guest identity (acct-001)', () => {
  it('issues a signed token that identifies the same guest', async () => {
    const { token, user } = await guest();
    expect(user.kind).toBe('guest');
    const me = await exports.default.fetch(`${BASE}/api/me`, { headers: { authorization: `Bearer ${token}` } });
    expect(await me.json()).toEqual(user);
  });

  it('rejects missing, forged and tampered tokens', async () => {
    const { token } = await guest();
    const [payload, signature] = token.split('.');
    const forged = `${btoa(JSON.stringify({ id: 'g_evil', name: '1', kind: 'guest' }))}.${signature}`;
    for (const bad of ['', 'nope', forged, `${payload}.AAAA`]) {
      const res = await exports.default.fetch(`${BASE}/api/me`, { headers: { authorization: `Bearer ${bad}` } });
      expect(res.status).toBe(401);
    }
    expect((await exports.default.fetch(`${BASE}/api/games`, { method: 'POST', body: '{}' })).status).toBe(401);
  });
});

describe('GameRoom Durable Object (online-001)', () => {
  it('shows a waiting room summary until the second player joins', async () => {
    const alice = await guest();
    const code = await createGame(alice.token);
    const res = await exports.default.fetch(`${BASE}/api/games/${code}`);
    expect(RoomSummary.parse(await res.json())).toMatchObject({ code, status: 'waiting', openColor: 'b' });
    expect((await exports.default.fetch(`${BASE}/api/games/ZZZZZZ`)).status).toBe(404);
  });

  it('validates moves on the server and broadcasts legal ones to both players', async () => {
    const { white, black } = await startedGame();

    white.send({ type: 'move', uci: 'e3e5', ply: 0 });
    expect(await white.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });

    black.send({ type: 'move', uci: 'd6d5', ply: 0 });
    expect(await black.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'not_your_turn' });

    white.send({ type: 'move', uci: 'e3e4', ply: 0 });
    await white.state((g) => g.moves.join() === 'e3e4');
    const seen = await black.state((g) => g.moves.length === 1);
    expect(seen.game.moves).toEqual(['e3e4']);
    expect(seen.game.clock?.running).toBe('b');
  });

  it('has no chat: unknown message types are rejected', async () => {
    const { white } = await startedGame();
    white.send({ type: 'chat', text: 'hello' });
    expect(await white.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'bad_message' });
  });

  it('keeps the game when the Durable Object hibernates between moves', async () => {
    const { code, white, black } = await startedGame();
    white.send({ type: 'move', uci: 'e3e4', ply: 0 });
    await black.state((g) => g.moves.length === 1);

    await evictDurableObject(stubFor(code), { webSockets: 'hibernate' });

    black.send({ type: 'move', uci: 'd6d5', ply: 1 });
    const after = await white.state((g) => g.moves.length === 2);
    expect(after.game.moves).toEqual(['e3e4', 'd6d5']);
    expect(after.you).toBe('w');
  });
});

describe('server clocks (online-003)', () => {
  it('a player who runs out of time loses when the alarm fires', async () => {
    const { code, black } = await startedGame({ initialMs: 300, incrementMs: 0 });
    await sleep(350);
    // The alarm is scheduled for the flag time; Miniflare may already have fired it on its own.
    await runDurableObjectAlarm(stubFor(code));
    const over = await black.state((g) => g.status === 'finished');
    expect(over.game.result).toEqual({ winner: 'b', reason: 'timeout' });
  });
});

describe('reconnect, abandonment and rematch (online-004)', () => {
  it('a player who reconnects within the grace period keeps playing', async () => {
    const { code, alice, white, black } = await startedGame();
    white.ws.close(1000, 'bye');
    await black.state((g) => g.disconnect?.color === 'w' && g.players.w?.connected === false);
    const again = await connect(code, alice.token);
    const back = await again.state((g, you) => you === 'w' && g.disconnect === null);
    expect(back.game.status).toBe('playing');
    await black.state((g) => g.disconnect === null);
  });

  it('a player who stays away past the grace period loses by abandonment', async () => {
    const { code, white, black } = await startedGame();
    white.ws.close(1000, 'bye');
    await black.state((g) => g.disconnect?.color === 'w');
    await sleep(250);
    await runDurableObjectAlarm(stubFor(code));
    const over = await black.state((g) => g.status === 'finished');
    expect(over.game.result).toEqual({ winner: 'b', reason: 'abandon' });
  });

  it('resign, then both accept a rematch in a new room with colours swapped', async () => {
    const { alice, white, black } = await startedGame();
    white.send({ type: 'resign' });
    await black.state((g) => g.result?.reason === 'resign' && g.result.winner === 'b');
    white.send({ type: 'rematch' });
    await black.state((g) => g.rematchOfferBy === 'w');
    black.send({ type: 'rematch' });
    const next = await white.state((g) => g.nextCode !== null);
    const rematch = await connect(next.game.nextCode!, alice.token);
    const seat = await rematch.state(() => true);
    expect(seat.you).toBe('b');
    expect(seat.game.status).toBe('playing');
  });
});
