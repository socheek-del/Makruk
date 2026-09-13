import type { Color, Game, GameStatus, MoveRecord, Piece, PieceType } from '@makruk/engine';

export type ResultReason =
  | 'checkmate'
  | 'stalemate'
  | 'repetition'
  | 'counting'
  | 'insufficient-material'
  | 'timeout'
  | 'resign'
  | 'agreement'
  | 'abandon';

export interface GameResult {
  /** null for a draw */
  winner: Color | null;
  reason: ResultReason;
}

export function resultFromStatus(status: GameStatus): GameResult | null {
  switch (status.kind) {
    case 'ongoing':
      return null;
    case 'checkmate':
      return { winner: status.winner, reason: 'checkmate' };
    default:
      return { winner: null, reason: status.kind };
  }
}

/** Approximate Makruk material values. */
export const PIECE_VALUE: Record<PieceType, number> = { k: 0, r: 5, n: 3, s: 2.5, m: 2, p: 1 };

const valueOf = (piece: Piece) => PIECE_VALUE[piece.type];

/** Pieces captured by `color`, in capture order. */
export function capturedBy(records: readonly MoveRecord[], color: Color): Piece[] {
  return records.filter((r) => r.color === color && r.captured).map((r) => r.captured!);
}

/** Material on the board: positive when White is ahead. */
export function materialBalance(game: Game): number {
  return game.pieces().reduce((sum, { piece }) => sum + (piece.color === 'w' ? 1 : -1) * valueOf(piece), 0);
}
