import { BLACK, colorBits, FERZ, fileOf, KING, KING_TARGETS, KNIGHT, rankOf, ROOK, SILVER } from '@chaturanga/rules-core';
import { dropType, moveTo, type Position } from '@chaturanga/sittuyin/core';

/**
 * Setup placements for bots. Search is not used: the 16-ply setup tree is huge and almost entirely quiet.
 * Instead every legal placement gets a score drawn from traditional Sittuyin arrangements — Yahhta on the
 * back rank towards the corners, the Min-gyi sheltered behind the Ne with its Sit-ke and Sin beside it,
 * Myin forward on the open squares in front of the back ranks — plus persona noise.
 */
export function setupScore(pos: Position, move: number): number {
  const c = pos.turn;
  const to = moveTo(move);
  const file = fileOf(to);
  const rel = c === 0 ? rankOf(to) : 7 - rankOf(to);
  const own = colorBits(c);
  const ownKing = pos.board.findIndex((p) => p === (KING | own));
  const besideKing = ownKing >= 0 && KING_TARGETS[ownKing]!.includes(to);
  const edge = Math.min(file, 7 - file); // 0 at the a/h files .. 3 in the centre

  switch (dropType(move)) {
    case ROOK:
      return [30, 15, 6, 4][edge]!;
    case KING: {
      const guards = KING_TARGETS[to]!.filter((s) => {
        const p = pos.board[s]!;
        return p !== 0 && (p & BLACK) === own && ((p & 7) === FERZ || (p & 7) === SILVER);
      }).length;
      return [15, 30, -20][rel]! + (edge >= 1 && edge <= 3 ? 15 : 0) + guards * 12;
    }
    case FERZ:
      return (besideKing ? 40 : 0) + (rel === 1 ? 15 : rel === 0 ? 0 : 5);
    case SILVER:
      return (besideKing ? 20 : 0) + (rel >= 1 ? 15 : 0) + edge * 2;
    case KNIGHT:
      return [-5, 10, 30][rel]! + edge * 3;
    default:
      return 0;
  }
}

/** Picks a setup placement from `legal` (all drops): the best score after ±noise per move. */
export function chooseSetupMove(pos: Position, legal: readonly number[], noise: number, rng: () => number): number {
  let best = legal[0]!;
  let bestScore = -Infinity;
  for (const move of legal) {
    const score = setupScore(pos, move) + (noise > 0 ? (rng() * 2 - 1) * noise : 0);
    if (score > bestScore) {
      best = move;
      bestScore = score;
    }
  }
  return best;
}
