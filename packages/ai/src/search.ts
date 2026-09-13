import * as core from '@makruk/engine/core';
import { evaluate, PIECE_VALUE } from './evaluate';

const { generateLegalMoves, inCheck, isPromotion, makeRaw, moveFrom, moveTo, placementOf, TYPE_MASK, unmakeRaw } = core;

/** Position identity for repetition: placement + side to move (matches the first two FEN fields). */
export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 2).join(' ');
}

export const MATE = 100_000;
const MAX_PLY = 64;
const QUIESCENCE_DEPTH = 6;
/** Ply (after the opponent's reply) at which positions are checked against the game history. */
const REPETITION_PLY = 2;

export interface SearchOptions {
  maxDepth: number;
  /**
   * Earlier positions in the game as `positionKey` strings. A root move that recreates one of them
   * is scored as a draw (repetition) instead of being searched.
   */
  history?: readonly string[];
  /** Centipawns a draw by repetition is worth *less* than 0 to the side to move (avoids aimless shuffling). */
  contempt?: number;
  /** Stop after roughly this many nodes (deterministic budget). */
  maxNodes?: number;
  /** Absolute timestamp (ms) after which the search stops. */
  deadline?: number;
  now?: () => number;
}

export interface RootMove {
  move: number;
  score: number;
}

export interface SearchResult {
  /** Encoded best move, or -1 if the side to move has no legal moves. */
  move: number;
  score: number;
  depth: number;
  nodes: number;
  /** Root moves with scores from the last completed depth, best first. */
  rootMoves: RootMove[];
}

const opposite = (c: core.ColorIndex): core.ColorIndex => (c === 0 ? 1 : 0);

function orderMoves(board: core.Board, moves: number[], first?: number): number[] {
  const key = (m: number) => {
    if (m === first) return 1_000_000;
    const victim = board[moveTo(m)]! & TYPE_MASK;
    const attacker = board[moveFrom(m)]! & TYPE_MASK;
    let k = 0;
    if (victim) k += 10 * PIECE_VALUE[victim]! - PIECE_VALUE[attacker]!;
    if (isPromotion(m)) k += 900;
    return k;
  };
  return moves.map((m) => [key(m), m] as const).sort((a, b) => b[0] - a[0]).map(([, m]) => m);
}

export function search(position: { board: core.Board; turn: core.ColorIndex }, options: SearchOptions): SearchResult {
  const board = position.board.slice();
  const root = position.turn;
  const now = options.now ?? (() => Date.now());
  let nodes = 0;
  let stopped = false;

  const shouldStop = () => {
    if (stopped) return true;
    if ((nodes & 511) !== 0) return false;
    if (options.maxNodes !== undefined && nodes >= options.maxNodes) stopped = true;
    else if (options.deadline !== undefined && now() >= options.deadline) stopped = true;
    return stopped;
  };

  const quiesce = (alpha: number, beta: number, side: core.ColorIndex, qdepth: number): number => {
    nodes++;
    const standPat = evaluate(board, side);
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
    if (qdepth === 0 || shouldStop()) return alpha;
    const tactical = generateLegalMoves(board, side).filter((m) => board[moveTo(m)] !== 0 || isPromotion(m));
    for (const m of orderMoves(board, tactical)) {
      const moved = board[moveFrom(m)]!;
      const captured = makeRaw(board, m);
      const score = -quiesce(-beta, -alpha, opposite(side), qdepth - 1);
      unmakeRaw(board, m, moved, captured);
      if (stopped) return alpha;
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  };

  const seen = new Set(options.history ?? []);
  const contempt = options.contempt ?? 0;

  const negamax = (depth: number, alpha: number, beta: number, side: core.ColorIndex, ply: number): number => {
    if (shouldStop()) return 0;
    // The opponent's reply recreating an earlier position is a draw too: without this, a stronger bot walks
    // into lines where the weaker side can repeat. Only near the root, where the key's string cost is small.
    if (ply === REPETITION_PLY && seen.size > 0 && seen.has(`${placementOf(board)} ${side === 0 ? 'w' : 'b'}`)) {
      return side === root ? -contempt : contempt;
    }
    const checked = inCheck(board, side);
    if (checked && ply < MAX_PLY) depth++; // check extension: don't stop the search in the middle of a mating attack
    if (depth <= 0) return quiesce(alpha, beta, side, QUIESCENCE_DEPTH);
    nodes++;
    const moves = generateLegalMoves(board, side);
    if (moves.length === 0) return checked ? -MATE + ply : 0;
    for (const m of orderMoves(board, moves)) {
      const moved = board[moveFrom(m)]!;
      const captured = makeRaw(board, m);
      const score = -negamax(depth - 1, -beta, -alpha, opposite(side), ply + 1);
      unmakeRaw(board, m, moved, captured);
      if (stopped) return 0;
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  };

  let rootMoves: RootMove[] = generateLegalMoves(board, root).map((move) => ({ move, score: 0 }));
  if (rootMoves.length === 0) {
    return { move: -1, score: inCheck(board, root) ? -MATE : 0, depth: 0, nodes: 0, rootMoves: [] };
  }

  const repetitionScore = -contempt;
  const afterKey = () => `${placementOf(board)} ${root === 0 ? 'b' : 'w'}`;

  let completedDepth = 0;
  for (let depth = 1; depth <= options.maxDepth; depth++) {
    const scored: RootMove[] = [];
    let alpha = -MATE - 1;
    const ordered = orderMoves(board, rootMoves.map((r) => r.move), rootMoves[0]!.move);
    for (const m of ordered) {
      const moved = board[moveFrom(m)]!;
      const captured = makeRaw(board, m);
      // Full window at the root so every root move gets a real score (used for bot noise and hints).
      const score =
        seen.size > 0 && seen.has(afterKey())
          ? repetitionScore
          : -negamax(depth - 1, -MATE - 1, MATE + 1, opposite(root), 1);
      unmakeRaw(board, m, moved, captured);
      if (stopped) break;
      scored.push({ move: m, score });
      if (score > alpha) alpha = score;
    }
    if (stopped && scored.length < ordered.length) break;
    rootMoves = scored.sort((a, b) => b.score - a.score);
    completedDepth = depth;
    if (rootMoves[0]!.score >= MATE - MAX_PLY) break; // forced mate found
  }

  const best = rootMoves[0]!;
  return { move: best.move, score: best.score, depth: completedDepth, nodes, rootMoves };
}
