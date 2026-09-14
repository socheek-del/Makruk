import type { ColorIndex } from '@makruk/engine/core';
import { parseFen } from './fen';
import { generateLegalMoves, isDrop, makeRaw, moveFrom, type Position, unmakeRaw } from './movegen';

function count(pos: Position, depth: number): number {
  const moves = generateLegalMoves(pos);
  if (depth === 1) return moves.length;
  const mover = pos.turn;
  const next: ColorIndex = mover === 0 ? 1 : 0;
  let nodes = 0;
  for (const m of moves) {
    const moved = isDrop(m) ? 0 : pos.board[moveFrom(m)]!;
    const captured = makeRaw(pos, m, mover);
    pos.turn = next;
    nodes += count(pos, depth - 1);
    pos.turn = mover;
    unmakeRaw(pos, m, mover, moved, captured);
  }
  return nodes;
}

/** Number of leaf nodes of the legal move tree to `depth` plies (no game-end adjudication). */
export function perft(fen: string, depth: number): number {
  if (depth <= 0) return 1;
  const { board, hands, turn } = parseFen(fen);
  return count({ board, hands, turn }, depth);
}
