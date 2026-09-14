export type Color = 'w' | 'b';

/** k = Khun (king), m = Met, s = Khon, n = Ma (knight), r = Ruea (rook), p = Bia (pawn). */
export type PieceType = 'k' | 'm' | 's' | 'n' | 'r' | 'p';

export interface Piece {
  color: Color;
  type: PieceType;
  /** True for a Bia that promoted (Bia Ngai); it moves like a Met. */
  promoted: boolean;
}

/** 0..63 with a1 = 0, b1 = 1, …, h8 = 63. */
export type Square = number;

export interface Move {
  from: Square;
  to: Square;
  /** A Bia reaching its promotion rank always promotes to Met. */
  promotion: boolean;
}

export interface MoveRecord extends Move {
  /** Coordinate notation, e.g. `e3e4`, promotion suffixed with `m` (`a5a6m`). */
  uci: string;
  san: string;
  piece: Piece;
  captured: Piece | null;
  color: Color;
  fenAfter: string;
}

export type GameStatus =
  | { kind: 'ongoing' }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'repetition' }
  | { kind: 'counting' }
  /** Neither side can force mate (Fairy-Stockfish insufficient-material rule). */
  | { kind: 'insufficient-material' };

export interface CountingState {
  /** Board's honour (counting side has more than a Khun) or pieces' honour (lone Khun). */
  kind: 'board' | 'pieces';
  /** The side that is counting (the disadvantaged side). */
  side: Color;
  /** Limit in plies, as tracked by Fairy-Stockfish. */
  limitPlies: number;
  /** Plies counted so far. A draw is declared once it exceeds the limit. */
  plies: number;
}
