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
