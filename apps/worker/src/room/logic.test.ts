import { ClientMessage, GameSnapshot } from '@makruk/protocol';
import { describe, expect, it } from 'vitest';
import { applyMessage, createRoom, join, leave, nextAlarm, roomStatus, settle, snapshot } from './logic';

const alice = { id: 'u-alice', name: 'Alice', kind: 'guest' as const };
const bob = { id: 'u-bob', name: 'Bob', kind: 'guest' as const };
const code = () => 'NEXT23';

function playingRoom(timeControl = { initialMs: 60_000, incrementMs: 2_000 }) {
  const created = createRoom({ code: 'ABCDEF', creator: alice, color: 'w', timeControl, now: 0 });
  return join(created, bob, 1_000).room;
}

describe('seating', () => {
  it('waits for a second player, then starts with White on the clock', () => {
    const room = createRoom({ code: 'ABCDEF', creator: alice, color: 'b', timeControl: { initialMs: 60_000, incrementMs: 0 }, now: 0 });
    expect(roomStatus(room)).toBe('waiting');
    const joined = join(room, bob, 5_000);
    expect(joined.color).toBe('w');
    expect(roomStatus(joined.room)).toBe('playing');
    expect(joined.room.clock?.running).toBe('w');
  });

  it('reseats a returning player and makes a third person a spectator', () => {
    const room = playingRoom();
    expect(join(room, alice, 2_000).color).toBe('w');
    expect(join(room, { id: 'u-carol', name: 'Carol', kind: 'guest' }, 2_000).color).toBeNull();
  });
});

describe('moves (online-001)', () => {
  it('accepts a legal move on your turn and presses the clock with increment', () => {
    const { room, error } = applyMessage(playingRoom(), 'w', { type: 'move', uci: 'e3e4', ply: 0 }, 11_000, code);
    expect(error).toBeUndefined();
    expect(room.moves).toEqual(['e3e4']);
    expect(room.clock?.running).toBe('b');
    expect(room.clock?.remaining.w).toBe(60_000 - 10_000 + 2_000);
  });

  it('rejects illegal moves, wrong turns, stale plies and spectators', () => {
    const room = playingRoom();
    expect(applyMessage(room, 'w', { type: 'move', uci: 'e3e5', ply: 0 }, 2_000, code).error).toBe('illegal_move');
    expect(applyMessage(room, 'b', { type: 'move', uci: 'e6e5', ply: 0 }, 2_000, code).error).toBe('not_your_turn');
    expect(applyMessage(room, 'w', { type: 'move', uci: 'e3e4', ply: 3 }, 2_000, code).error).toBe('stale_ply');
    expect(applyMessage(room, null, { type: 'move', uci: 'e3e4', ply: 0 }, 2_000, code).error).toBe('not_a_player');
  });

  it('ends the game on checkmate', () => {
    const room = { ...playingRoom(), startFen: 'k7/2R5/8/8/8/8/8/4K2R w - - 0 1' };
    const { room: after } = applyMessage(room, 'w', { type: 'move', uci: 'h1h8', ply: 0 }, 2_000, code);
    expect(after.result).toEqual({ winner: 'w', reason: 'checkmate' });
    expect(after.clock?.running).toBeNull();
  });

  it('has no chat message type', () => {
    expect(ClientMessage.safeParse({ type: 'chat', text: 'hello' }).success).toBe(false);
  });
});

describe('clocks (online-003)', () => {
  it('flags the side whose time runs out, even before they try to move', () => {
    const room = playingRoom({ initialMs: 5_000, incrementMs: 0 });
    expect(nextAlarm(room)).toBe(1_000 + 5_000);
    expect(settle(room, 5_999).result).toBeNull();
    expect(settle(room, 6_000).result).toEqual({ winner: 'b', reason: 'timeout' });
    const late = applyMessage(room, 'w', { type: 'move', uci: 'e3e4', ply: 0 }, 7_000, code);
    expect(late.error).toBe('game_over');
    expect(late.room.result?.reason).toBe('timeout');
  });

  it('increment is applied after every move', () => {
    let room = playingRoom({ initialMs: 10_000, incrementMs: 1_000 });
    room = applyMessage(room, 'w', { type: 'move', uci: 'e3e4', ply: 0 }, 3_000, code).room;
    room = applyMessage(room, 'b', { type: 'move', uci: 'd6d5', ply: 1 }, 6_000, code).room;
    expect(room.clock?.remaining).toEqual({ w: 10_000 - 2_000 + 1_000, b: 10_000 - 3_000 + 1_000 });
    expect(nextAlarm(room)).toBe(6_000 + 9_000);
  });
});

describe('resign, draw, rematch, abandonment (online-004)', () => {
  it('resigning gives the win to the opponent', () => {
    expect(applyMessage(playingRoom(), 'b', { type: 'resign' }, 2_000, code).room.result).toEqual({ winner: 'w', reason: 'resign' });
  });

  it('a draw needs an offer from one side and acceptance from the other', () => {
    let room = applyMessage(playingRoom(), 'w', { type: 'offerDraw' }, 2_000, code).room;
    expect(room.drawOfferBy).toBe('w');
    expect(applyMessage(room, 'w', { type: 'acceptDraw' }, 2_000, code).room.result).toBeNull();
    expect(applyMessage(room, 'b', { type: 'declineDraw' }, 2_000, code).room.drawOfferBy).toBeNull();
    room = applyMessage(room, 'b', { type: 'acceptDraw' }, 2_000, code).room;
    expect(room.result).toEqual({ winner: null, reason: 'agreement' });
  });

  it('a rematch needs both players and produces a new room code', () => {
    let room = applyMessage(playingRoom(), 'w', { type: 'resign' }, 2_000, code).room;
    const first = applyMessage(room, 'w', { type: 'rematch' }, 3_000, code);
    expect(first.rematch).toBeUndefined();
    room = first.room;
    const second = applyMessage(room, 'b', { type: 'rematch' }, 3_000, code);
    expect(second.rematch).toBe(true);
    expect(second.room.nextCode).toBe('NEXT23');
  });

  it('a disconnected player who returns within the grace period keeps playing', () => {
    let room = leave(playingRoom(), 'w', 10_000, 30_000);
    expect(room.disconnect).toEqual({ color: 'w', at: 40_000 });
    expect(settle(room, 39_000).result).toBeNull();
    room = join(room, alice, 39_000).room;
    expect(room.disconnect).toBeNull();
  });

  it('abandonment past the grace period awards the win to the opponent', () => {
    const room = leave(playingRoom({ initialMs: 600_000, incrementMs: 0 }), 'b', 10_000, 30_000);
    expect(nextAlarm(room)).toBe(40_000);
    expect(settle(room, 40_000).result).toEqual({ winner: 'w', reason: 'abandon' });
  });
});

describe('snapshot', () => {
  it('matches the protocol schema and reports clock times at the snapshot moment', () => {
    const room = playingRoom();
    const snap = snapshot(room, 4_000, { w: true, b: false });
    expect(GameSnapshot.parse(snap)).toEqual(snap);
    expect(snap.clock).toEqual({ w: 57_000, b: 60_000, running: 'w', serverTime: 4_000 });
    expect(snap.players.b?.connected).toBe(false);
  });
});
