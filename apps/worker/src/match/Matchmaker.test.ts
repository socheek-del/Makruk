import { GuestResponse, MatchServerMessage, ServerMessage } from '@makruk/protocol';
import { exports as providedExports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';

const exports = providedExports as unknown as { default: { fetch: (input: string, init?: RequestInit) => Promise<Response> } };
const BASE = 'https://th-chess.test';
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function guest() {
  const res = await exports.default.fetch(`${BASE}/api/guest`, { method: 'POST' });
  return GuestResponse.parse(await res.json());
}

async function seek(pool: string, token: string) {
  const res = await exports.default.fetch(`${BASE}/ws/match/${encodeURIComponent(pool)}?token=${encodeURIComponent(token)}`, {
    headers: { Upgrade: 'websocket' },
  });
  expect(res.status).toBe(101);
  const ws = res.webSocket!;
  const inbox: MatchServerMessage[] = [];
  ws.accept();
  ws.addEventListener('message', (event: MessageEvent) => inbox.push(MatchServerMessage.parse(JSON.parse(event.data as string))));
  const next = async (type: MatchServerMessage['type'], timeoutMs = 2_000) => {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const found = inbox.find((m) => m.type === type);
      if (found) return found;
      if (Date.now() > deadline) throw new Error(`no ${type}; got ${JSON.stringify(inbox)}`);
      await sleep(10);
    }
  };
  return { ws, inbox, next };
}

describe('quick match (online-005)', () => {
  it('pairs two players in the same pool into one game with the pool time control', async () => {
    const a = await guest();
    const b = await guest();
    const first = await seek('5+0', a.token);
    await first.next('queued');
    const second = await seek('5+0', b.token);
    const matchedA = await first.next('matched');
    const matchedB = await second.next('matched');
    expect(matchedA).toEqual(matchedB);
    const code = (matchedA as { code: string }).code;

    const room = await exports.default.fetch(`${BASE}/ws/game/${code}?token=${encodeURIComponent(a.token)}`, {
      headers: { Upgrade: 'websocket' },
    });
    const ws = room.webSocket!;
    const states: ServerMessage[] = [];
    ws.accept();
    ws.addEventListener('message', (event: MessageEvent) => states.push(ServerMessage.parse(JSON.parse(event.data as string))));
    await sleep(100);
    const state = states.find((m) => m.type === 'state');
    expect(state?.type === 'state' && state.game.status).toBe('playing');
    expect(state?.type === 'state' && state.game.timeControl).toEqual({ initialMs: 300_000, incrementMs: 0 });
  });

  it('does not pair different pools or a player with themself', async () => {
    const a = await guest();
    const b = await guest();
    const blitz = await seek('3+2', a.token);
    await blitz.next('queued');
    const selfAgain = await seek('3+2', a.token);
    await selfAgain.next('queued');
    const rapid = await seek('10+0', b.token);
    await rapid.next('queued');
    await sleep(100);
    expect([...blitz.inbox, ...selfAgain.inbox, ...rapid.inbox].some((m) => m.type === 'matched')).toBe(false);
    for (const s of [blitz, selfAgain, rapid]) s.ws.close(1000, 'done');
  });

  it('cancelling a search removes the player from the queue', async () => {
    const [a, b, c] = [await guest(), await guest(), await guest()];
    const cancelled = await seek('10+0', a.token);
    await cancelled.next('queued');
    cancelled.ws.close(1000, 'cancel');
    await sleep(50);

    const waiting = await seek('10+0', b.token);
    await waiting.next('queued');
    await sleep(100);
    expect(waiting.inbox.some((m) => m.type === 'matched')).toBe(false);

    const joiner = await seek('10+0', c.token);
    expect(await joiner.next('matched')).toEqual(await waiting.next('matched'));
  });

  it('rejects unknown pools', async () => {
    const a = await guest();
    const bad = await seek('1+0', a.token);
    expect(await bad.next('error')).toEqual({ type: 'error', code: 'bad_pool' });
  });
});
