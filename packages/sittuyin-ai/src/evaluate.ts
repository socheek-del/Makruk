import {
  BLACK,
  type ColorIndex,
  FERZ,
  fileOf,
  KING,
  KNIGHT,
  PAWN,
  rankOf,
  ROOK,
  SILVER,
  TYPE_MASK,
} from '@chaturanga/rules-core';
import { HAND_ORDER, type Position, PROMOTION_SQUARES } from '@chaturanga/sittuyin/core';

/** Material in centipawns, indexed by piece code: Ne, Myin, Sin, Sit-ke, Yahhta, Min-gyi. */
export const PIECE_VALUE = [0, 100, 320, 260, 210, 520, 0] as const;

/** Endgame bonus per missing defender piece for the side that is clearly ahead. */
const TRADE_DOWN = 60;
/** Ne advancement bonus by relative rank (0 = own back rank). Ne start on relative ranks 2 and 3. */
const NE_ADVANCE = [0, 0, 0, 0, 14, 28, 36, 36];
/** A Ne standing on a promotion square while its side has no Sit-ke can become one next move. */
const PROMOTION_READY = 24;

const centerDistance = (sq: number) =>
  Math.max(3 - Math.min(fileOf(sq), 7 - fileOf(sq)), 3 - Math.min(rankOf(sq), 7 - rankOf(sq)));

interface Tally {
  material: [number, number];
  pieces: [number, number];
  pawns: [number, number];
  ferz: [boolean, boolean];
  kings: [number, number];
}

function tally(pos: Position): Tally {
  const t: Tally = { material: [0, 0], pieces: [0, 0], pawns: [0, 0], ferz: [false, false], kings: [-1, -1] };
  for (let sq = 0; sq < 64; sq++) {
    const p = pos.board[sq]!;
    if (!p) continue;
    const c = p & BLACK ? 1 : 0;
    const type = p & TYPE_MASK;
    t.pieces[c]++;
    t.material[c] += PIECE_VALUE[type]!;
    if (type === PAWN) t.pawns[c]++;
    if (type === FERZ) t.ferz[c] = true;
    if (type === KING) t.kings[c] = sq;
  }
  // Pieces still in hand during setup count as material too.
  for (const c of [0, 1] as const) {
    for (const type of HAND_ORDER) {
      const n = pos.hands[c][type]!;
      t.pieces[c] += n;
      t.material[c] += n * PIECE_VALUE[type]!;
      if (type === FERZ && n > 0) t.ferz[c] = true;
    }
  }
  return t;
}

/** Pure material difference (centipawns) from `side`'s point of view, pieces in hand included. */
export function materialBalance(pos: Position, side: ColorIndex): number {
  const t = tally(pos);
  const diff = t.material[0] - t.material[1];
  return side === 0 ? diff : -diff;
}

/**
 * Static evaluation in centipawns from the point of view of `side` (0 = White, 1 = Black): material,
 * piece placement, Ne advancement and promotion chances, and an endgame mop-up so a winning side mates
 * the lone Min-gyi before the Sittuyin count or the 50-move rule draws the game.
 */
export function evaluate(pos: Position, side: ColorIndex): number {
  const t = tally(pos);
  const phaseMaterial = t.material[0] + t.material[1] - 100 * (t.pawns[0] + t.pawns[1]);
  const endgame = phaseMaterial <= 1400;
  const score: [number, number] = [t.material[0], t.material[1]];

  for (let sq = 0; sq < 64; sq++) {
    const p = pos.board[sq]!;
    if (!p) continue;
    const c = p & BLACK ? 1 : 0;
    const relRank = c === 0 ? rankOf(sq) : 7 - rankOf(sq);
    const center = 3 - centerDistance(sq); // 0 (edge) .. 3 (centre)
    switch (p & TYPE_MASK) {
      case PAWN:
        score[c] += NE_ADVANCE[relRank]! + (fileOf(sq) >= 2 && fileOf(sq) <= 5 ? 4 : 0);
        if (!t.ferz[c] && (t.pawns[c] === 1 || PROMOTION_SQUARES[c][sq])) score[c] += PROMOTION_READY;
        break;
      case KNIGHT:
        score[c] += center * 8 - 8;
        break;
      case SILVER:
      case FERZ:
        score[c] += center * 4;
        break;
      case ROOK:
        score[c] += relRank >= 5 ? 10 : 0;
        break;
      case KING:
        score[c] += endgame ? center * 10 : relRank <= 1 ? 10 : -relRank * 6;
        break;
    }
  }

  const diff = t.material[0] - t.material[1];
  if (endgame && Math.abs(diff) >= 180 && t.kings[0] >= 0 && t.kings[1] >= 0) {
    const strong = diff > 0 ? 0 : 1;
    const weak = strong === 0 ? 1 : 0;
    const weakKing = t.kings[weak];
    const strongKing = t.kings[strong];
    const kingGap = Math.abs(fileOf(weakKing) - fileOf(strongKing)) + Math.abs(rankOf(weakKing) - rankOf(strongKing));
    const bare = t.pieces[weak] <= 2;
    score[strong] += centerDistance(weakKing) * (bare ? 60 : 25) + (14 - kingGap) * (bare ? 14 : 6);
    // Trade down when ahead: every defending piece delays the mate while the count runs.
    score[strong] += (16 - t.pieces[weak]) * TRADE_DOWN;
  }

  const white = score[0] - score[1];
  return side === 0 ? white : -white;
}
