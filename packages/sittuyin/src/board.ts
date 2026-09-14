/**
 * Sittuyin letters, pieces in hand and the setup region on the shared numeric board.
 *
 * Pieces move like their Makruk counterparts (Sit-ke = ferz, Sin = silver general), so square
 * numbering, piece codes, move tables and attack detection come from @chaturanga/rules-core.
 */
import {
  BLACK,
  type ColorIndex,
  colorIndexOf,
  FERZ,
  KING,
  KNIGHT,
  PROMOTED,
  rankOf,
  ROOK,
  SILVER,
  toColor,
  typeOf,
} from '@chaturanga/rules-core';
import type { Piece, PieceType, Square } from './types';

/** Letter per piece code: 1 Ne, 2 Myin, 3 Sin, 4 Sit-ke, 5 Yahhta, 6 Min-gyi. */
const TYPE_CHARS: readonly string[] = ['', 'p', 'n', 's', 'f', 'r', 'k'];

export function typeFromChar(ch: string): number {
  return ch.length === 1 ? Math.max(TYPE_CHARS.indexOf(ch.toLowerCase()), 0) : 0;
}

/** FEN letter: uppercase for White. */
export function codeToChar(code: number): string {
  const ch = TYPE_CHARS[typeOf(code)]!;
  return code & BLACK ? ch : ch.toUpperCase();
}

export function codeToPiece(code: number): Piece {
  return {
    color: toColor(colorIndexOf(code)),
    type: TYPE_CHARS[typeOf(code)] as PieceType,
    promoted: (code & PROMOTED) !== 0,
  };
}

/** Pieces in hand per colour, counted by piece code (index 0 unused). */
export type Hands = [Uint8Array, Uint8Array];

export const emptyHands = (): Hands => [new Uint8Array(7), new Uint8Array(7)];

export const handCount = (hand: Uint8Array): number => hand.reduce((sum, n) => sum + n, 0);

/** Order in which Fairy-Stockfish lists pieces in hand. A Ne is never in hand. */
export const HAND_ORDER: readonly number[] = [KING, SILVER, FERZ, ROOK, KNIGHT];

/** Setup drops go on a side's own three ranks; a Yahhta only on its back rank. */
export function inDropRegion(sq: Square, c: ColorIndex, type: number): boolean {
  const rank = c === 0 ? rankOf(sq) : 7 - rankOf(sq);
  return type === ROOK ? rank === 0 : rank <= 2;
}
