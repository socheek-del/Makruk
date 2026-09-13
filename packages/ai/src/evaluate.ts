import * as core from '@makruk/engine/core';

const { BLACK, KHON, KING, KNIGHT, MET, PAWN, ROOK, TYPE_MASK, fileOf, rankOf } = core;

/** Material in centipawns, indexed by piece type code. */
export const PIECE_VALUE = [0, 100, 320, 260, 210, 520, 0] as const;

/** Endgame bonus per missing defender piece for the side that is clearly ahead. */
const TRADE_DOWN = 60;

const centerDistance = (sq: number) => Math.max(3 - Math.min(fileOf(sq), 7 - fileOf(sq)), 3 - Math.min(rankOf(sq), 7 - rankOf(sq)));

/** Bia advancement bonus by relative rank (0 = own back rank). Bia start on relative rank 2 and promote on 5. */
const BIA_ADVANCE = [0, 0, 0, 12, 30, 0, 0, 0];

export interface Tally {
  material: [number, number];
  pieces: [number, number];
  pawns: [number, number];
  kings: [number, number];
}

function tally(board: core.Board): Tally {
  const t: Tally = { material: [0, 0], pieces: [0, 0], pawns: [0, 0], kings: [-1, -1] };
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]!;
    if (!p) continue;
    const c = p & BLACK ? 1 : 0;
    const type = p & TYPE_MASK;
    t.pieces[c]++;
    t.material[c] += PIECE_VALUE[type]!;
    if (type === PAWN) t.pawns[c]++;
    if (type === KING) t.kings[c] = sq;
  }
  return t;
}

/** Pure material difference (centipawns) from `side`'s point of view. */
export function materialBalance(board: core.Board, side: core.ColorIndex): number {
  const t = tally(board);
  const diff = t.material[0] - t.material[1];
  return side === 0 ? diff : -diff;
}

/**
 * Static evaluation in centipawns from the point of view of `side` (0 = White, 1 = Black).
 * Material + piece placement + endgame "mop-up" so winning sides actually drive the Khun to mate
 * before Makruk counting rules draw the game.
 */
export function evaluate(board: core.Board, side: core.ColorIndex): number {
  const t = tally(board);
  const phaseMaterial = t.material[0] + t.material[1] - 100 * (t.pawns[0] + t.pawns[1]);
  const endgame = phaseMaterial <= 1400;
  const score: [number, number] = [t.material[0], t.material[1]];

  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]!;
    if (!p) continue;
    const c = p & BLACK ? 1 : 0;
    const relRank = c === 0 ? rankOf(sq) : 7 - rankOf(sq);
    const center = 3 - centerDistance(sq); // 0 (edge) .. 3 (centre)
    switch (p & TYPE_MASK) {
      case PAWN:
        score[c] += BIA_ADVANCE[relRank]! + (fileOf(sq) >= 2 && fileOf(sq) <= 5 ? 4 : 0);
        break;
      case KNIGHT:
        score[c] += center * 8 - 8;
        break;
      case KHON:
      case MET:
        score[c] += center * 4;
        break;
      case ROOK:
        score[c] += relRank >= 5 ? 10 : 0;
        break;
      case KING:
        score[c] += endgame ? center * 10 : relRank === 0 ? 10 : -relRank * 6;
        break;
    }
  }

  // Mop-up: reward pushing the weaker Khun to the edge and bringing our Khun close. Makruk counting
  // rules give the stronger side few moves to mate, so this is weighted heavily when the defender is bare.
  const diff = t.material[0] - t.material[1];
  if (endgame && Math.abs(diff) >= 180 && t.kings[0] >= 0 && t.kings[1] >= 0) {
    const strong = diff > 0 ? 0 : 1;
    const weak = strong === 0 ? 1 : 0;
    const weakKing = t.kings[weak];
    const strongKing = t.kings[strong];
    const kingGap = Math.abs(fileOf(weakKing) - fileOf(strongKing)) + Math.abs(rankOf(weakKing) - rankOf(strongKing));
    const bare = t.pieces[weak] <= 2;
    score[strong] += centerDistance(weakKing) * (bare ? 60 : 25) + (14 - kingGap) * (bare ? 14 : 6);
    // Trade down when ahead: every defending piece (a checking Ruea above all) delays the mate while the
    // count runs. Worth less than a Bia, so it favours even trades but never a sacrifice.
    score[strong] += (16 - t.pieces[weak]) * TRADE_DOWN;
  }

  const white = score[0] - score[1];
  return side === 0 ? white : -white;
}
