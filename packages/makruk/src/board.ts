/**
 * Makruk letters and promotion rank on the shared numeric board (@chaturanga/rules-core).
 *
 * Board encoding, square helpers and move tables are shared with Sittuyin and re-exported here under
 * Makruk names: Khon = silver general, Met = ferz.
 */
import {
  BLACK,
  colorIndexOf,
  FERZ as MET,
  KING,
  KNIGHT,
  PAWN,
  PROMOTED,
  ROOK,
  SILVER as KHON,
  toColor,
  typeOf,
} from '@chaturanga/rules-core';
import type { Piece, PieceType } from './types';

export {
  BLACK,
  type Board,
  type ColorIndex,
  colorBits,
  colorIndexOf,
  fileOf,
  FERZ as MET,
  FERZ_TARGETS as MET_TARGETS,
  KING,
  KING_TARGETS,
  KNIGHT,
  KNIGHT_TARGETS,
  PAWN,
  PAWN_CAPTURES,
  parseSquare,
  PROMOTED,
  rankOf,
  ROOK,
  ROOK_RAYS,
  SILVER as KHON,
  SILVER_TARGETS as KHON_TARGETS,
  squareName,
  toColor,
  toColorIndex,
  TYPE_MASK,
  typeOf,
} from '@chaturanga/rules-core';

const TYPE_CHARS: readonly PieceType[] = ['p', 'p', 'n', 's', 'm', 'r', 'k'];

export function typeFromChar(ch: string): number {
  switch (ch.toLowerCase()) {
    case 'p':
      return PAWN;
    case 'n':
      return KNIGHT;
    case 's':
      return KHON;
    case 'm':
      return MET;
    case 'r':
      return ROOK;
    case 'k':
      return KING;
    default:
      return 0;
  }
}

export function codeToPiece(code: number): Piece {
  return {
    color: toColor(colorIndexOf(code)),
    type: TYPE_CHARS[typeOf(code)] as PieceType,
    promoted: (code & PROMOTED) !== 0,
  };
}

export function pieceToCode(piece: Piece): number {
  return typeFromChar(piece.type) | (piece.color === 'b' ? BLACK : 0) | (piece.promoted ? PROMOTED : 0);
}

/** FEN letter: uppercase for White. */
export function codeToChar(code: number): string {
  const ch = TYPE_CHARS[typeOf(code)] as string;
  return code & BLACK ? ch : ch.toUpperCase();
}

/** Rank index (0-based) on which a Bia of this color promotes. */
export const PROMOTION_RANK: readonly [number, number] = [5, 2];
