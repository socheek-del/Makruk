import type { Color, GameStatus } from '@chaturanga/rules-core';

export type ResultReason =
  | 'checkmate'
  | 'stalemate'
  | 'repetition'
  | 'counting'
  | 'fifty-move'
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

/** Endings a takeback cannot reverse: they are decisions or events outside the position. */
export const FINAL_REASONS: readonly ResultReason[] = ['timeout', 'resign', 'agreement', 'abandon'];

export function isUndoableResult(result: GameResult | null): boolean {
  return !result || !FINAL_REASONS.includes(result.reason);
}

/** Pieces captured by `color`, in capture order. */
export function capturedBy<P>(records: ReadonlyArray<{ color: Color; captured: P | null }>, color: Color): P[] {
  return records.filter((r) => r.color === color && r.captured).map((r) => r.captured!);
}

/** Material on the board by the game's own piece values: positive when White is ahead. */
export function materialBalance(
  game: { pieces(): ReadonlyArray<{ piece: { color: Color; type: string } }> },
  values: Readonly<Record<string, number>>,
): number {
  return game.pieces().reduce((sum, { piece }) => sum + (piece.color === 'w' ? 1 : -1) * (values[piece.type] ?? 0), 0);
}
