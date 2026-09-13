/**
 * Numeric board encoding and precomputed move tables.
 *
 * A square holds 0 (empty) or a piece code: type (1..6) | BLACK (8) | PROMOTED (16).
 * Squares are 0..63 with a1 = 0. Color index: 0 = White, 1 = Black.
 */
import type { Color, Piece, PieceType, Square } from './types';

export const PAWN = 1;
export const KNIGHT = 2;
export const KHON = 3;
export const MET = 4;
export const ROOK = 5;
export const KING = 6;
export const BLACK = 8;
export const PROMOTED = 16;
export const TYPE_MASK = 7;

export type ColorIndex = 0 | 1;
export type Board = Uint8Array;

const TYPE_CHARS: readonly PieceType[] = ['p', 'p', 'n', 's', 'm', 'r', 'k'];

export const typeOf = (code: number): number => code & TYPE_MASK;
export const colorIndexOf = (code: number): ColorIndex => (code & BLACK ? 1 : 0);
export const colorBits = (c: ColorIndex): number => (c === 1 ? BLACK : 0);
export const toColor = (c: ColorIndex): Color => (c === 1 ? 'b' : 'w');
export const toColorIndex = (c: Color): ColorIndex => (c === 'b' ? 1 : 0);
export const fileOf = (sq: Square): number => sq & 7;
export const rankOf = (sq: Square): number => sq >> 3;

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

export function squareName(sq: Square): string {
  return 'abcdefgh'[fileOf(sq)]! + String(rankOf(sq) + 1);
}

/** Returns -1 for an invalid square name. */
export function parseSquare(name: string): Square {
  if (!/^[a-h][1-8]$/.test(name)) return -1;
  return (name.charCodeAt(1) - 49) * 8 + (name.charCodeAt(0) - 97);
}

function leaper(deltas: ReadonlyArray<readonly [number, number]>): Square[][] {
  const table: Square[][] = [];
  for (let sq = 0; sq < 64; sq++) {
    const list: Square[] = [];
    for (const [df, dr] of deltas) {
      const f = fileOf(sq) + df;
      const r = rankOf(sq) + dr;
      if (f >= 0 && f < 8 && r >= 0 && r < 8) list.push(r * 8 + f);
    }
    table.push(list);
  }
  return table;
}

const DIAGONALS = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
] as const;
const ORTHOGONALS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export const KNIGHT_TARGETS = leaper([
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
]);
export const KING_TARGETS = leaper([...DIAGONALS, ...ORTHOGONALS]);
/** Met and promoted Bia: one step diagonally. */
export const MET_TARGETS = leaper(DIAGONALS);
/** Khon: one step diagonally or one step straight forward. Indexed by color. */
export const KHON_TARGETS: readonly [Square[][], Square[][]] = [
  leaper([...DIAGONALS, [0, 1]]),
  leaper([...DIAGONALS, [0, -1]]),
];
/** Bia capture targets, indexed by color. */
export const PAWN_CAPTURES: readonly [Square[][], Square[][]] = [
  leaper([
    [1, 1],
    [-1, 1],
  ]),
  leaper([
    [1, -1],
    [-1, -1],
  ]),
];
/** Rook rays: for each square, 4 arrays of squares ordered outward. */
export const ROOK_RAYS: Square[][][] = Array.from({ length: 64 }, (_, sq) =>
  ORTHOGONALS.map(([df, dr]) => {
    const ray: Square[] = [];
    let f = fileOf(sq) + df;
    let r = rankOf(sq) + dr;
    while (f >= 0 && f < 8 && r >= 0 && r < 8) {
      ray.push(r * 8 + f);
      f += df;
      r += dr;
    }
    return ray;
  }),
);

/** Rank index (0-based) on which a Bia of this color promotes. */
export const PROMOTION_RANK: readonly [number, number] = [5, 2];
