export type Color = 'w' | 'b';

/** k = Min-gyi (king), f = Sit-ke (general), s = Sin (elephant), n = Myin (horse), r = Yahhta (chariot), p = Ne (pawn). */
export type PieceType = 'k' | 'f' | 's' | 'n' | 'r' | 'p';

export interface Piece {
  color: Color;
  type: PieceType;
  /** True for a Sit-ke that was a promoted Ne. */
  promoted: boolean;
}

/** 0..63 with a1 = 0, b1 = 1, …, h8 = 63. */
export type Square = number;

export type Move =
  /** Setup placement of a piece from hand, e.g. `R@a1`. */
  | { kind: 'drop'; type: PieceType; to: Square }
  /** A piece move; `promotion` turns a Ne into a Sit-ke (`h5g4f`, or in place `e5e5f`). */
  | { kind: 'move'; from: Square; to: Square; promotion: boolean };

export type MoveRecord = Move & {
  /** Coordinate notation as used by Fairy-Stockfish: `e3e4`, `h5g4f`, `K@h3`. */
  uci: string;
  san: string;
  piece: Piece;
  captured: Piece | null;
  color: Color;
  fenAfter: string;
};

export type GameStatus =
  | { kind: 'ongoing' }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' };
