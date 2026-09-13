import { type Color, Game, IllegalMoveError, type Move, type MoveRecord, START_FEN } from '@makruk/engine';
import { create } from 'zustand';
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

const NON_UNDOABLE: ReadonlyArray<GameResult['reason']> = ['timeout', 'resign', 'agreement', 'abandon'];

export function createGameSession() {
  return create<GameSessionState>((set, get) => ({
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
  }));
}

/** Pass-and-play game on this device. */
export const useLocalSession = createGameSession();

/** Game against the computer. */
export const useComputerSession = createGameSession();
