/**
 * Sittuyin move generation on the numeric board.
 * Moves are encoded as from | to << 6 | flags; a drop keeps the dropped piece code in the `from` bits.
 */
import {
  BLACK,
  type Board,
  type ColorIndex,
  colorBits,
  inCheck,
  KHON,
  KHON_TARGETS,
  KING,
  KING_TARGETS,
  KNIGHT,
  KNIGHT_TARGETS,
  MET,
  MET_TARGETS,
  PAWN,
  PAWN_CAPTURES,
  PROMOTED,
  ROOK,
  ROOK_RAYS,
  TYPE_MASK,
} from '@makruk/engine/core';
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

/** Moves of pieces already on the board. */
export function generatePieceMoves(board: Board, c: ColorIndex, out: number[] = []): number[] {
  const bits = colorBits(c);
  for (let from = 0; from < 64; from++) {
    const p = board[from]!;
    if (!isOwn(p, bits)) continue;
    switch (p & TYPE_MASK) {
      case PAWN: {
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
      case KHON:
        pushLeaper(board, from, KHON_TARGETS[c][from]!, bits, out);
        break;
      case MET:
        pushLeaper(board, from, MET_TARGETS[from]!, bits, out);
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
  board[to] = isPromotion(m) ? (piece & BLACK) | MET | PROMOTED : piece;
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
  const legal = !inCheck(pos.board, c);
  unmakeRaw(pos, m, c, moved, captured);
  return legal;
}

export function generateLegalMoves(pos: Position): number[] {
  return generatePseudoMoves(pos).filter((m) => isLegal(pos, m, pos.turn));
}
