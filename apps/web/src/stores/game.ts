import { Game, IllegalMoveError, type Move, type MoveRecord } from '@makruk/engine';
import { create } from 'zustand';

export interface GameStore {
  game: Game;
  /** Bumped on every change so subscribers re-render (the Game instance is mutable). */
  version: number;
  move: (move: Move | string) => MoveRecord | null;
  undo: () => MoveRecord | null;
  reset: (fen?: string) => void;
}

export function createGameStore() {
  return create<GameStore>((set, get) => ({
    game: new Game(),
    version: 0,
    move: (move) => {
      try {
        const record = get().game.move(move);
        set((s) => ({ version: s.version + 1 }));
        return record;
      } catch (err) {
        if (err instanceof IllegalMoveError) return null;
        throw err;
      }
    },
    undo: () => {
      const record = get().game.undo();
      if (record) set((s) => ({ version: s.version + 1 }));
      return record;
    },
    reset: (fen) => set((s) => ({ game: new Game(fen), version: s.version + 1 })),
  }));
}

/** Pass-and-play game on this device. */
export const useLocalGame = createGameStore();
