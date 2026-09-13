/**
 * Move generation and attack detection on the numeric board.
 * Moves are encoded as from | to << 6 | promotion << 12.
 */
import {
  BLACK,
  type Board,
  type ColorIndex,
  colorBits,
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
  PROMOTION_RANK,
  rankOf,
  ROOK,
  ROOK_RAYS,
  TYPE_MASK,
} from './board';
import type { Square } from './types';

export const PROMOTION_FLAG = 1 << 12;

export const encodeMove = (from: Square, to: Square, promotion: boolean): number =>
  from | (to << 6) | (promotion ? PROMOTION_FLAG : 0);
export const moveFrom = (m: number): Square => m & 63;
export const moveTo = (m: number): Square => (m >> 6) & 63;
export const isPromotion = (m: number): boolean => (m & PROMOTION_FLAG) !== 0;

const isOwn = (code: number, bits: number): boolean => code !== 0 && (code & BLACK) === bits;

export function findKing(board: Board, c: ColorIndex): Square {
  const code = KING | colorBits(c);
  for (let sq = 0; sq < 64; sq++) if ((board[sq]! & ~PROMOTED) === code) return sq;
  return -1;
}

/** True if `sq` is attacked by any piece of color `by`. */
export function isAttacked(board: Board, sq: Square, by: ColorIndex): boolean {
  const bits = colorBits(by);
  const opp: ColorIndex = by === 0 ? 1 : 0;

  for (const s of PAWN_CAPTURES[opp][sq]!) if (board[s] === (bits | PAWN)) return true;
  for (const s of KNIGHT_TARGETS[sq]!) if (board[s] === (bits | KNIGHT)) return true;
  for (const s of KING_TARGETS[sq]!) if (board[s] === (bits | KING)) return true;
  for (const s of MET_TARGETS[sq]!) {
    const p = board[s]!;
    if (isOwn(p, bits) && ((p & TYPE_MASK) === MET || (p & TYPE_MASK) === KHON)) return true;
  }
  // A Khon also attacks the square directly in front of it.
  const behind = by === 0 ? sq - 8 : sq + 8;
  if (behind >= 0 && behind < 64 && board[behind] === (bits | KHON)) return true;

  for (const ray of ROOK_RAYS[sq]!) {
    for (const s of ray) {
      const p = board[s]!;
      if (p === 0) continue;
      if (p === (bits | ROOK)) return true;
      break;
    }
  }
  return false;
}

export function inCheck(board: Board, c: ColorIndex): boolean {
  const king = findKing(board, c);
  return king >= 0 && isAttacked(board, king, c === 0 ? 1 : 0);
}

function pushLeaper(board: Board, from: Square, targets: readonly Square[], bits: number, out: number[]): void {
  for (const to of targets) if (!isOwn(board[to]!, bits)) out.push(encodeMove(from, to, false));
}

export function generatePseudoMoves(board: Board, c: ColorIndex, out: number[] = []): number[] {
  const bits = colorBits(c);
  for (let from = 0; from < 64; from++) {
    const p = board[from]!;
    if (!isOwn(p, bits)) continue;
    switch (p & TYPE_MASK) {
      case PAWN: {
        const to = c === 0 ? from + 8 : from - 8;
        if (to >= 0 && to < 64 && board[to] === 0) out.push(encodeMove(from, to, rankOf(to) === PROMOTION_RANK[c]));
        for (const cap of PAWN_CAPTURES[c][from]!) {
          const q = board[cap]!;
          if (q !== 0 && (q & BLACK) !== bits) out.push(encodeMove(from, cap, rankOf(cap) === PROMOTION_RANK[c]));
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
              out.push(encodeMove(from, to, false));
              continue;
            }
            if ((q & BLACK) !== bits) out.push(encodeMove(from, to, false));
            break;
          }
        }
        break;
    }
  }
  return out;
}

/** Applies a move to the board in place and returns the captured code (0 if none). */
export function makeRaw(board: Board, m: number): number {
  const from = moveFrom(m);
  const to = moveTo(m);
  const piece = board[from]!;
  const captured = board[to]!;
  board[to] = isPromotion(m) ? (piece & BLACK) | MET | PROMOTED : piece;
  board[from] = 0;
  return captured;
}

export function unmakeRaw(board: Board, m: number, movedPiece: number, captured: number): void {
  board[moveFrom(m)] = movedPiece;
  board[moveTo(m)] = captured;
}

export function isLegal(board: Board, m: number, c: ColorIndex): boolean {
  const piece = board[moveFrom(m)]!;
  const captured = makeRaw(board, m);
  const legal = !inCheck(board, c);
  unmakeRaw(board, m, piece, captured);
  return legal;
}

export function generateLegalMoves(board: Board, c: ColorIndex): number[] {
  return generatePseudoMoves(board, c).filter((m) => isLegal(board, m, c));
}
