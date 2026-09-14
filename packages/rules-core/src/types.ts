export type Color = 'w' | 'b';

/** 0..63 with a1 = 0, b1 = 1, …, h8 = 63. */
export type Square = number;

export interface Piece<T extends string = string> {
  color: Color;
  /** FEN letter in lower case, e.g. 'k'. */
  type: T;
  /** True for a piece that reached its type by promotion. */
  promoted: boolean;
}

/** Every way a game can end across the supported variants; each variant reports a subset. */
export type GameStatus =
  | { kind: 'ongoing' }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'repetition' }
  /** A counting rule's limit ran out before mate. */
  | { kind: 'counting' }
  | { kind: 'fifty-move' }
  /** Neither side can force mate (Fairy-Stockfish insufficient-material rule). */
  | { kind: 'insufficient-material' };
