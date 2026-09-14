/**
 * Sittuyin move generation on the numeric board.
 * Moves are encoded as from | to << 6 | flags; a drop keeps the dropped piece code in the `from` bits.
 */
import {
  BLACK,
  type Board,
  type ColorIndex,
  colorBits,
  FERZ,
  FERZ_TARGETS,
  inCheck,
  KING,
  KING_TARGETS,
  KNIGHT,
  KNIGHT_TARGETS,
  PAWN,
  PAWN_CAPTURES,
  parseSquare,
  PROMOTED,
  ROOK,
  ROOK_RAYS,
  SILVER,
  SILVER_TARGETS,
  TYPE_MASK,
} from '@chaturanga/rules-core';
import { HAND_ORDER, type Hands, inDropRegion } from './board';
import type { Square } from './types';

export const DROP_FLAG = 1 << 12;
export const PROMOTION_FLAG = 1 << 13;

export const encodeMove = (from: Square, to: Square, flags = 0): number => from | (to << 6) | flags;
export const encodeDrop = (type: number, to: Square): number => type | (to << 6) | DROP_FLAG;
export const moveFrom = (m: number): Square => m & 63;
export const moveTo = (m: number): Square => (m >> 6) & 63;
export const isDrop = (m: number): boolean => (m & DROP_FLAG) !== 0;
export const isPromotion = (m: number): boolean => (m & PROMOTION_FLAG) !== 0;
/** Piece code placed by a drop. */
export const dropType = (m: number): number => m & 63;

export interface Position {
  board: Board;
  hands: Hands;
  turn: ColorIndex;
}

const isOwn = (code: number, bits: number): boolean => code !== 0 && (code & BLACK) === bits;

function squareSet(names: string): Uint8Array {
  const set = new Uint8Array(64);
  for (const name of names.split(' ')) set[parseSquare(name)] = 1;
  return set;
}

/** Where a Ne may promote while its side has more than one Ne: the long diagonals in the opponent's half. */
export const PROMOTION_SQUARES: readonly [Uint8Array, Uint8Array] = [
  squareSet('a8 b7 c6 d5 e5 f6 g7 h8'),
  squareSet('a1 b2 c3 d4 e4 f3 g2 h1'),
];

export function generateDrops(pos: Position, out: number[] = []): number[] {
  const c = pos.turn;
  const hand = pos.hands[c];
  for (const type of HAND_ORDER) {
    if (!hand[type]) continue;
    for (let sq = 0; sq < 64; sq++) {
      if (pos.board[sq] === 0 && inDropRegion(sq, c, type)) out.push(encodeDrop(type, sq));
    }
  }
  return out;
}

function pushLeaper(board: Board, from: Square, targets: readonly Square[], bits: number, out: number[]): void {
  for (const to of targets) if (!isOwn(board[to]!, bits)) out.push(encodeMove(from, to));
}

/**
 * Ne promotion to Sit-ke (Fairy-Stockfish sittuyin): only while the side has no Sit-ke, from a
 * promotion square unless it is the side's last Ne, onto the Ne's own square or an empty diagonal
 * neighbour, and never where the new Sit-ke would attack an enemy piece (so it never checks).
 */
function generatePromotions(board: Board, c: ColorIndex, pawns: readonly Square[], out: number[]): void {
  const bits = colorBits(c);
  if (pawns.length === 0 || board.some((p) => isOwn(p, bits) && (p & TYPE_MASK) === FERZ)) return;
  const enemy = colorBits(c === 0 ? 1 : 0);
  const attacksEnemy = (sq: Square) => FERZ_TARGETS[sq]!.some((s) => isOwn(board[s]!, enemy));
  for (const from of pawns) {
    if (pawns.length > 1 && !PROMOTION_SQUARES[c][from]) continue;
    for (const to of [from, ...FERZ_TARGETS[from]!]) {
      if ((to === from || board[to] === 0) && !attacksEnemy(to)) out.push(encodeMove(from, to, PROMOTION_FLAG));
    }
  }
}

/** Moves of pieces already on the board, including promotions. */
export function generatePieceMoves(board: Board, c: ColorIndex, out: number[] = []): number[] {
  const bits = colorBits(c);
  const pawns: Square[] = [];
  for (let from = 0; from < 64; from++) {
    const p = board[from]!;
    if (!isOwn(p, bits)) continue;
    switch (p & TYPE_MASK) {
      case PAWN: {
        pawns.push(from);
        const to = c === 0 ? from + 8 : from - 8;
        if (to >= 0 && to < 64 && board[to] === 0) out.push(encodeMove(from, to));
        for (const cap of PAWN_CAPTURES[c][from]!) {
          const q = board[cap]!;
          if (q !== 0 && (q & BLACK) !== bits) out.push(encodeMove(from, cap));
        }
        break;
      }
      case KNIGHT:
        pushLeaper(board, from, KNIGHT_TARGETS[from]!, bits, out);
        break;
      case SILVER:
        pushLeaper(board, from, SILVER_TARGETS[c][from]!, bits, out);
        break;
      case FERZ:
        pushLeaper(board, from, FERZ_TARGETS[from]!, bits, out);
        break;
      case KING:
        pushLeaper(board, from, KING_TARGETS[from]!, bits, out);
        break;
      case ROOK:
        for (const ray of ROOK_RAYS[from]!) {
          for (const to of ray) {
            const q = board[to]!;
            if (q === 0) {
              out.push(encodeMove(from, to));
              continue;
            }
            if ((q & BLACK) !== bits) out.push(encodeMove(from, to));
            break;
          }
        }
        break;
    }
  }
  generatePromotions(board, c, pawns, out);
  return out;
}

/** A side that still has pieces it can place must place one (Fairy-Stockfish mustDrop). */
export function generatePseudoMoves(pos: Position): number[] {
  const drops = generateDrops(pos);
  return drops.length ? drops : generatePieceMoves(pos.board, pos.turn);
}

/** Applies a move for colour `c` in place and returns the captured code (0 if none). */
export function makeRaw(pos: Position, m: number, c: ColorIndex): number {
  const { board } = pos;
  const to = moveTo(m);
  if (isDrop(m)) {
    const type = dropType(m);
    board[to] = type | colorBits(c);
    pos.hands[c][type] = pos.hands[c][type]! - 1;
    return 0;
  }
  const from = moveFrom(m);
  const piece = board[from]!;
  const captured = from === to ? 0 : board[to]!;
  board[from] = 0;
  board[to] = isPromotion(m) ? (piece & BLACK) | FERZ | PROMOTED : piece;
  return captured;
}

export function unmakeRaw(pos: Position, m: number, c: ColorIndex, moved: number, captured: number): void {
  const { board } = pos;
  const to = moveTo(m);
  if (isDrop(m)) {
    const type = dropType(m);
    board[to] = 0;
    pos.hands[c][type] = pos.hands[c][type]! + 1;
    return;
  }
  board[to] = captured;
  board[moveFrom(m)] = moved;
}

export function isLegal(pos: Position, m: number, c: ColorIndex): boolean {
  const moved = isDrop(m) ? 0 : pos.board[moveFrom(m)]!;
  const captured = makeRaw(pos, m, c);
  // A promotion may not give check, not even a discovered one.
  const legal = !inCheck(pos.board, c) && !(isPromotion(m) && inCheck(pos.board, c === 0 ? 1 : 0));
  unmakeRaw(pos, m, c, moved, captured);
  return legal;
}

export function generateLegalMoves(pos: Position): number[] {
  return generatePseudoMoves(pos).filter((m) => isLegal(pos, m, pos.turn));
}
