import { START_FEN } from '@makruk/engine';
import { describe, expect, it } from 'vitest';
import { timesAt } from '../features/game/clock';
import { createGameSession } from './localSession';

describe('game session', () => {
  it('starts in setup and begins play with a clock running for White', () => {
    const store = createGameSession();
    expect(store.getState().phase).toBe('setup');
    store.getState().start({ initialMs: 60_000, incrementMs: 1_000 }, undefined, 0);
    const { phase, clock } = store.getState();
    expect(phase).toBe('playing');
    expect(clock?.running).toBe('w');
  });

  it('moves press the clock with increment', () => {
    const store = createGameSession();
    store.getState().start({ initialMs: 60_000, incrementMs: 2_000 }, undefined, 0);
    expect(store.getState().move('e3e4', 5_000)).not.toBeNull();
    const { clock } = store.getState();
    expect(clock?.running).toBe('b');
    expect(timesAt(clock!, 5_000)).toEqual({ w: 57_000, b: 60_000 });
  });

  it('flags a side that runs out of time and blocks further moves', () => {
    const store = createGameSession();
    store.getState().start({ initialMs: 1_000, incrementMs: 0 }, undefined, 0);
    store.getState().tick(1_500);
    expect(store.getState().result).toEqual({ winner: 'b', reason: 'timeout' });
    expect(store.getState().move('e3e4', 1_600)).toBeNull();
  });

  it('records checkmate as a result', () => {
    const store = createGameSession();
    store.getState().start(null, 'k7/2R5/8/8/8/8/8/4K2R w - - 0 1');
    store.getState().move('h1h8');
    expect(store.getState().result).toEqual({ winner: 'w', reason: 'checkmate' });
  });

  it('undo removes the last move and clears a checkmate result, but not a resignation', () => {
    const store = createGameSession();
    store.getState().start(null, 'k7/2R5/8/8/8/8/8/4K2R w - - 0 1');
    store.getState().move('h1h8');
    store.getState().undo();
    expect(store.getState().result).toBeNull();
    expect(store.getState().game.moves()).toHaveLength(0);
    store.getState().resign('w');
    store.getState().undo();
    expect(store.getState().result).toEqual({ winner: 'b', reason: 'resign' });
  });

  it('a saved session is restored after a reload: moves, clock, result and orientation', () => {
    const first = createGameSession('test.session');
    first.getState().start({ initialMs: 60_000, incrementMs: 1_000 }, undefined, 1_000);
    first.getState().move('e3e4', 2_000);
    first.getState().move('d6d5', 4_000);
    first.getState().flip();
    first.getState().setViewPly(1);

    const reloaded = createGameSession('test.session').getState();
    expect(reloaded.phase).toBe('playing');
    expect(reloaded.game.moves().map((r) => r.uci)).toEqual(['e3e4', 'd6d5']);
    expect(reloaded.game.fen()).toBe(first.getState().game.fen());
    expect(reloaded.clock).toEqual(first.getState().clock);
    expect(reloaded.timeControl).toEqual({ initialMs: 60_000, incrementMs: 1_000 });
    expect(reloaded.flipped).toBe(true);
    expect(reloaded.viewPly).toBeNull();
    expect(reloaded.move('e4d5', 5_000)).not.toBeNull();
  });

  it('a finished game stays finished after a reload, and returning to setup is remembered', () => {
    const first = createGameSession('test.finished');
    first.getState().start(null);
    first.getState().move('e3e4');
    first.getState().resign('b');
    expect(createGameSession('test.finished').getState().result).toEqual({ winner: 'w', reason: 'resign' });
    first.getState().exitToSetup();
    expect(createGameSession('test.finished').getState().phase).toBe('setup');
  });

  it('unreadable saved state starts a fresh session instead of crashing', () => {
    localStorage.setItem('test.corrupt', JSON.stringify({ state: { phase: 'playing', startFen: 'not a fen', moves: ['e3e4'] }, version: 1 }));
    expect(createGameSession('test.corrupt').getState().phase).toBe('setup');
    localStorage.setItem('test.illegal', JSON.stringify({ state: { phase: 'playing', startFen: START_FEN, moves: ['e3e5'] }, version: 1 }));
    expect(createGameSession('test.illegal').getState().phase).toBe('setup');
  });

  it('sessions without a storage key are not saved', () => {
    createGameSession().getState().start(null);
    expect(localStorage.length).toBe(0);
  });

  it('history view is clamped and blocks moves while reviewing', () => {
    const store = createGameSession();
    store.getState().start(null);
    store.getState().move('e3e4');
    store.getState().move('d6d5');
    store.getState().setViewPly(1);
    expect(store.getState().viewPly).toBe(1);
    expect(store.getState().move('e4d5')).toBeNull();
    store.getState().setViewPly(5);
    expect(store.getState().viewPly).toBeNull();
  });
});
