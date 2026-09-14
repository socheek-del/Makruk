import type { GameSnapshot } from '@chaturanga/protocol';
import { describe, expect, it, vi } from 'vitest';
import { timesAt } from '../features/game/clock';
import { createOnlineSession } from './onlineSession';

const snapshot = (patch: Partial<GameSnapshot> = {}): GameSnapshot => ({
  code: 'ABCDEF',
  serverTime: 1,
  status: 'playing',
  startFen: 'rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1',
  moves: [],
  players: { w: { id: 'a', name: '1234', kind: 'guest', connected: true }, b: { id: 'b', name: '5678', kind: 'guest', connected: true } },
  timeControl: { initialMs: 60_000, incrementMs: 0 },
  rated: false,
  clock: { w: 60_000, b: 60_000, running: 'w', serverTime: 1 },
  result: null,
  drawOfferBy: null,
  rematchOfferBy: null,
  nextCode: null,
  disconnect: null,
  ...patch,
});

describe('online session adapter', () => {
  it('replays server moves and counts the running clock down locally', () => {
    const store = createOnlineSession();
    store.getState().receive({ type: 'state', you: 'b', game: snapshot({ moves: ['e3e4'], clock: { w: 59_000, b: 60_000, running: 'b', serverTime: 5 } }) }, 1_000);
    const { game, you, clock } = store.getState();
    expect(game.moves().map((m) => m.uci)).toEqual(['e3e4']);
    expect(you).toBe('b');
    expect(timesAt(clock!, 3_000)).toEqual({ w: 59_000, b: 58_000 });
  });

  it('sends moves only on your turn and applies them optimistically', () => {
    const store = createOnlineSession();
    const send = vi.fn();
    store.getState().bindSender(send);
    store.getState().receive({ type: 'state', you: 'w', game: snapshot() });
    expect(store.getState().move('d6d5')).toBeNull();
    expect(store.getState().move('e3e4')?.san).toBe('e4');
    expect(send).toHaveBeenCalledWith({ type: 'move', uci: 'e3e4', ply: 0 });
    expect(store.getState().move('d6d5')).toBeNull();
  });

  it('spectators and finished games cannot move', () => {
    const store = createOnlineSession();
    store.getState().receive({ type: 'state', you: null, game: snapshot() });
    expect(store.getState().move('e3e4')).toBeNull();
    store.getState().receive({ type: 'state', you: 'w', game: snapshot({ status: 'finished', result: { winner: 'b', reason: 'resign' } }) });
    expect(store.getState().move('e3e4')).toBeNull();
    expect(store.getState().result).toEqual({ winner: 'b', reason: 'resign' });
  });
});
