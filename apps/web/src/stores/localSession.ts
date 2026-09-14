import { type Color, Game, IllegalMoveError, type Move, type MoveRecord, START_FEN } from '@makruk/engine';
import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { type ClockState, createClock, flaggedSide, pressClock, runFor, stopClock } from '../features/game/clock';
import { type GameResult, resultFromStatus } from '../features/game/result';
import type { TimeControl } from '../features/game/timeControls';

export interface GameSessionState {
  phase: 'setup' | 'playing';
  game: Game;
  startFen: string;
  /** Bumped on every change: the Game instance is mutable. */
  version: number;
  timeControl: TimeControl | null;
  clock: ClockState | null;
  result: GameResult | null;
  /** Ply being reviewed (0 = start position); null while following the live game. */
  viewPly: number | null;
  flipped: boolean;

  start: (timeControl: TimeControl | null, fen?: string, now?: number) => void;
  move: (move: Move | string, now?: number) => MoveRecord | null;
  undo: (now?: number) => void;
  resign: (color: Color, now?: number) => void;
  tick: (now?: number) => void;
  setViewPly: (ply: number | null) => void;
  flip: () => void;
  exitToSetup: () => void;
}

export type GameSessionStore = UseBoundStore<StoreApi<GameSessionState>>;

/** What survives a page reload: the Game is rebuilt by replaying the moves. */
interface SavedSession {
  phase: GameSessionState['phase'];
  startFen: string;
  moves: string[];
  timeControl: TimeControl | null;
  clock: ClockState | null;
  result: GameResult | null;
  flipped: boolean;
}

const NON_UNDOABLE: ReadonlyArray<GameResult['reason']> = ['timeout', 'resign', 'agreement', 'abandon'];

const sessionCreator: StateCreator<GameSessionState> = (set, get) => ({
  phase: 'setup',
  game: new Game(),
  startFen: START_FEN,
  version: 0,
  timeControl: null,
  clock: null,
  result: null,
  viewPly: null,
  flipped: false,

  start: (timeControl, fen = START_FEN, now = Date.now()) => {
    const game = new Game(fen); // throws FenError for invalid positions
    set((s) => ({
      phase: 'playing',
      game,
      startFen: fen,
      timeControl,
      clock: timeControl ? createClock(timeControl.initialMs, now, game.turn) : null,
      result: resultFromStatus(game.status()),
      viewPly: null,
      version: s.version + 1,
    }));
  },

  move: (move, now = Date.now()) => {
    get().tick(now);
    const { game, result, viewPly, clock, timeControl } = get();
    if (result || viewPly !== null) return null;
    const mover = game.turn;
    let record: MoveRecord;
    try {
      record = game.move(move);
    } catch (err) {
      if (err instanceof IllegalMoveError) return null;
      throw err;
    }
    const nextResult = resultFromStatus(game.status());
    let nextClock = clock && timeControl ? pressClock(clock, mover, now, timeControl.incrementMs) : clock;
    if (nextClock && nextResult) nextClock = stopClock(nextClock, now);
    set((s) => ({ result: nextResult, clock: nextClock, version: s.version + 1 }));
    return record;
  },

  undo: (now = Date.now()) => {
    const { game, result, clock } = get();
    if (game.moves().length === 0 || (result && NON_UNDOABLE.includes(result.reason))) return;
    game.undo();
    set((s) => ({
      result: resultFromStatus(game.status()),
      clock: clock ? runFor(clock, game.turn, now) : null,
      viewPly: null,
      version: s.version + 1,
    }));
  },

  resign: (color, now = Date.now()) => {
    const { result, clock } = get();
    if (result) return;
    set((s) => ({
      result: { winner: color === 'w' ? 'b' : 'w', reason: 'resign' },
      clock: clock ? stopClock(clock, now) : null,
      version: s.version + 1,
    }));
  },

  tick: (now = Date.now()) => {
    const { clock, result } = get();
    if (!clock || result) return;
    const flagged = flaggedSide(clock, now);
    if (!flagged) return;
    set((s) => ({
      result: { winner: flagged === 'w' ? 'b' : 'w', reason: 'timeout' },
      clock: stopClock(clock, now),
      version: s.version + 1,
    }));
  },

  setViewPly: (ply) => {
    const total = get().game.moves().length;
    set({ viewPly: ply === null || ply >= total ? null : Math.max(0, ply) });
  },

  flip: () => set((s) => ({ flipped: !s.flipped })),

  exitToSetup: () => set((s) => ({ phase: 'setup', result: null, clock: null, viewPly: null, version: s.version + 1 })),
});

/** Rebuilds a saved game; anything unreadable (old format, bad FEN, illegal move) starts fresh. */
function restore(saved: Partial<SavedSession> | undefined, current: GameSessionState): GameSessionState {
  if (!saved || saved.phase !== 'playing' || typeof saved.startFen !== 'string' || !Array.isArray(saved.moves)) return current;
  try {
    const game = new Game(saved.startFen);
    for (const uci of saved.moves) game.move(uci);
    return {
      ...current,
      phase: 'playing',
      game,
      startFen: saved.startFen,
      timeControl: saved.timeControl ?? null,
      // Clocks keep running on wall time across a reload, like a real clock.
      clock: saved.clock ?? null,
      result: saved.result ?? null,
      flipped: saved.flipped ?? false,
      viewPly: null,
    };
  } catch {
    return current;
  }
}

/**
 * A local game session. With `storageKey` the game is saved in localStorage on every change and restored
 * when the page loads, so an accidental refresh (or pull-to-refresh) does not lose the game.
 */
export function createGameSession(storageKey?: string): GameSessionStore {
  if (!storageKey) return create<GameSessionState>()(sessionCreator);
  return create<GameSessionState>()(
    persist(sessionCreator, {
      name: storageKey,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): SavedSession => ({
        phase: s.phase,
        startFen: s.startFen,
        moves: s.game.moves().map((r) => r.uci),
        timeControl: s.timeControl,
        clock: s.clock,
        result: s.result,
        flipped: s.flipped,
      }),
      merge: (saved, current) => restore(saved as Partial<SavedSession> | undefined, current),
    }),
  ) as GameSessionStore;
}

/** Pass-and-play game on this device. */
export const useLocalSession = createGameSession('makruk.session.local');

/** Game against the computer. */
export const useComputerSession = createGameSession('makruk.session.computer');

/** Guided first game (lesson) against the easiest bot. */
export const useGuidedSession = createGameSession('makruk.session.guided');
