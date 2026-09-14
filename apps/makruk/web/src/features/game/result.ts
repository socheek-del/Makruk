import { materialBalance as balanceBy } from '@chaturanga/game-shell';
import type { Game, PieceType } from '@chaturanga/makruk';

/** Results and captures are shared by every game site; material values are Makruk's. */
export { capturedBy, type GameResult, type ResultReason, resultFromStatus } from '@chaturanga/game-shell';

/** Approximate Makruk material values. */
export const PIECE_VALUE: Record<PieceType, number> = { k: 0, r: 5, n: 3, s: 2.5, m: 2, p: 1 };

/** Material on the board: positive when White is ahead. */
export function materialBalance(game: Game): number {
  return balanceBy(game, PIECE_VALUE);
}
