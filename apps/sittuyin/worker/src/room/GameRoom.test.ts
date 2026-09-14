import { type GameSnapshot, GuestResponse, ServerMessage, type TimeControl } from '@chaturanga/protocol';
import { sittuyin } from '@chaturanga/sittuyin';
import { evictDurableObject } from 'cloudflare:test';
import { env as providedEnv, exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Env } from '../env';

// The test runtime's env/exports are untyped without `wrangler types`; narrow them to our Worker.
const env = providedEnv as unknown as Env;
const exports = providedExports as unknown as { default: { fetch: (input: string, init?: RequestInit) => Promise<Response> } };

const BASE = 'https://sittuyin.test';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

type StateMessage = Extract<ServerMessage, { type: 'state' }>;

interface Client {
  send: (message: unknown) => void;
  next: (predicate: (m: ServerMessage) => boolean) => Promise<ServerMessage>;
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

  const next: Client['next'] = async (predicate) => {
    const deadline = Date.now() + 3_000;
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
  const opening = await white.state((g) => g.status === 'playing');
  return { code, white, black, opening };
}

/** Plays the whole setup phase, one legal placement per turn; returns the moves and White's last state. */
async function completeSetup(white: Client, black: Client): Promise<{ placements: string[]; last: StateMessage }> {
  const game = sittuyin.createGame();
  let last: StateMessage | null = null;
  for (let ply = 0; ply < 16; ply++) {
    const uci = game.legalUci().find((move) => move.includes('@'))!;
    const mover = game.turn === 'w' ? white : black;
    game.move(uci);
    mover.send({ type: 'move', uci, ply });
    last = await white.state((g) => g.moves.length === ply + 1);
    await black.state((g) => g.moves.length === ply + 1);
  }
  return { placements: game.moves().map((record) => record.uci), last: last! };
}

describe('Sittuyin GameRoom (sit-008)', () => {
  it('starts rooms from the Sittuyin setup position', async () => {
    const { game } = (await startedGame()).opening;
    expect(game.variant).toBe('sittuyin');
    expect(game.startFen).toBe(sittuyin.startFen);
  });

  it('validates setup placements with the Sittuyin rules and broadcasts legal ones', async () => {
    const { white, black } = await startedGame();

    // Rank 8 is Black's side, and a Yahhta may only stand on the back rank.
    for (const uci of ['K@a8', 'R@d2']) {
      white.send({ type: 'move', uci, ply: 0 });
      expect(await white.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });
    }
    // A board move is not allowed while pieces are still in hand.
    white.send({ type: 'move', uci: 'e4e5', ply: 0 });
    expect(await white.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'illegal_move' });

    black.send({ type: 'move', uci: 'K@e8', ply: 0 });
    expect(await black.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'not_your_turn' });

    white.send({ type: 'move', uci: 'K@e1', ply: 0 });
    await white.state((g) => g.moves.join() === 'K@e1');
    const seen = await black.state((g) => g.moves.length === 1);
    expect(seen.game.moves).toEqual(['K@e1']);
  });

  it('clocks wait for the setup, start after the last placement, and board moves follow', async () => {
    const { white, black, opening } = await startedGame({ initialMs: 300_000, incrementMs: 0 });
    expect(opening.game.clock).toMatchObject({ w: 300_000, b: 300_000, running: null });

    const { placements, last: afterSetup } = await completeSetup(white, black);
    expect(afterSetup.game.clock?.running).toBe('w');
    expect(afterSetup.game.clock?.b).toBe(300_000);

    const game = sittuyin.createGame();
    for (const uci of placements) game.move(uci);
    const boardMove = game.legalUci().find((uci) => !uci.includes('@'))!;
    white.send({ type: 'move', uci: boardMove, ply: 16 });
    const moved = await black.state((g) => g.moves.length === 17);
    expect(moved.game.moves.at(-1)).toBe(boardMove);
    expect(moved.game.clock?.running).toBe('b');
  });

  it('keeps a half-finished setup when the Durable Object hibernates', async () => {
    const { code, white, black } = await startedGame();
    white.send({ type: 'move', uci: 'K@e1', ply: 0 });
    await black.state((g) => g.moves.length === 1);

    await evictDurableObject(env.GAME_ROOM.get(env.GAME_ROOM.idFromName(code)), { webSockets: 'hibernate' });

    black.send({ type: 'move', uci: 'K@d8', ply: 1 });
    const after = await white.state((g) => g.moves.length === 2);
    expect(after.game.moves).toEqual(['K@e1', 'K@d8']);
  });

  it('has no chat: unknown message types are rejected', async () => {
    const { white } = await startedGame();
    white.send({ type: 'chat', text: 'hello' });
    expect(await white.next((m) => m.type === 'error')).toEqual({ type: 'error', code: 'bad_message' });
  });

  it('stores a finished game in the Sittuyin D1 database', async () => {
    const { code, white, black } = await startedGame();
    white.send({ type: 'move', uci: 'K@e1', ply: 0 });
    await black.state((g) => g.moves.length === 1);
    black.send({ type: 'resign' });
    await white.state((g) => g.result?.reason === 'resign');

    let row: Record<string, unknown> | null = null;
    for (let i = 0; i < 50 && !row; i++) {
      row = await env.DB.prepare('SELECT variant, moves, winner, reason FROM games WHERE code = ?').bind(code).first();
      if (!row) await sleep(20);
    }
    expect(row).toEqual({ variant: 'sittuyin', moves: 'K@e1', winner: 'w', reason: 'resign' });
  });
});
