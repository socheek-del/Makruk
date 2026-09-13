/**
 * Makruk FEN, compatible with Fairy-Stockfish:
 *   <placement> <side> - <ep|countingLimit> <halfmove|countingPly> <fullmove>
 * Khon = s, Met = m. A promoted Bia is written as a Met followed by `~`.
 * While a counting rule is active, the 4th field holds the limit (plies) and the
 * 5th holds the plies counted so far.
 */
import {
  BLACK,
  type Board,
  codeToChar,
  type ColorIndex,
  KING,
  MET,
  PAWN,
  PROMOTED,
  rankOf,
  TYPE_MASK,
  typeFromChar,
} from './board';
import { findKing, isAttacked } from './movegen';

export const START_FEN = 'rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1';

export interface PositionData {
  board: Board;
  turn: ColorIndex;
  /** Counting limit in plies; 0 when no counting rule is active. */
  countingLimit: number;
  countingPly: number;
  rule50: number;
  fullmove: number;
}

export class FenError extends Error {
  constructor(
    message: string,
    readonly fen: string,
  ) {
    super(message);
    this.name = 'FenError';
  }
}

const DIGITS = /^\d+$/;

export function parseFen(fen: string): PositionData {
  const fields = fen.trim().split(/\s+/);
  if (fields.length < 2 || fields.length > 6) throw new FenError('FEN must have between 2 and 6 fields', fen);
  const [placement = '', side = '', castling = '-', fourth = '-', half = '0', full = '1'] = fields;

  const rows = placement.split('/');
  if (rows.length !== 8) throw new FenError('Placement must have 8 ranks', fen);

  const board = new Uint8Array(64);
  rows.forEach((row, i) => {
    const rank = 7 - i;
    let file = 0;
    for (let j = 0; j < row.length; j++) {
      const ch = row[j]!;
      if (ch >= '1' && ch <= '8') {
        file += Number(ch);
        continue;
      }
      const type = typeFromChar(ch);
      if (!type) throw new FenError(`Invalid piece character '${ch}'`, fen);
      if (file > 7) throw new FenError(`Rank ${rank + 1} has more than 8 squares`, fen);
      let code = type | (ch === ch.toLowerCase() ? BLACK : 0);
      if (row[j + 1] === '~') {
        if (type !== MET) throw new FenError("Only a Met can be marked promoted with '~'", fen);
        code |= PROMOTED;
        j++;
      }
      board[rank * 8 + file] = code;
      file++;
    }
    if (file !== 8) throw new FenError(`Rank ${rank + 1} does not have exactly 8 squares`, fen);
  });

  for (const c of [0, 1] as const) {
    const kings = board.filter((p) => p === (KING | (c ? BLACK : 0))).length;
    if (kings !== 1) throw new FenError(`${c ? 'Black' : 'White'} must have exactly one Khun`, fen);
  }
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]!;
    if ((p & TYPE_MASK) !== PAWN) continue;
    const black = (p & BLACK) !== 0;
    if (black ? rankOf(sq) <= 2 : rankOf(sq) >= 5) throw new FenError('Unpromoted Bia on its promotion rank', fen);
  }

  if (side !== 'w' && side !== 'b') throw new FenError("Side to move must be 'w' or 'b'", fen);
  const turn: ColorIndex = side === 'b' ? 1 : 0;
  if (castling !== '-') throw new FenError("Castling field must be '-' in Makruk", fen);

  let countingLimit = 0;
  if (DIGITS.test(fourth)) countingLimit = Number(fourth);
  else if (fourth !== '-') throw new FenError('Makruk has no en passant; 4th field must be - or a counting limit', fen);

  if (!DIGITS.test(half)) throw new FenError('Halfmove/counting field must be a number', fen);
  if (!DIGITS.test(full)) throw new FenError('Fullmove field must be a number', fen);

  let rule50 = Number(half);
  let countingPly = 0;
  if (countingLimit && rule50) {
    countingPly = rule50;
    rule50 = 0;
  }

  const opponent: ColorIndex = turn === 0 ? 1 : 0;
  if (isAttacked(board, findKing(board, opponent), turn)) {
    throw new FenError('The side not to move is in check', fen);
  }

  return { board, turn, countingLimit, countingPly, rule50, fullmove: Math.max(Number(full), 1) };
}

export function placementOf(board: Board): string {
  const rows: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const p = board[rank * 8 + file]!;
      if (p === 0) {
        empty++;
        continue;
      }
      if (empty) row += String(empty);
      empty = 0;
      row += codeToChar(p) + (p & PROMOTED ? '~' : '');
    }
    if (empty) row += String(empty);
    rows.push(row);
  }
  return rows.join('/');
}

export function serializeFen(pos: PositionData): string {
  const side = pos.turn === 1 ? 'b' : 'w';
  const fourth = pos.countingLimit ? String(pos.countingLimit) : '-';
  const fifth = pos.countingLimit ? pos.countingPly : pos.rule50;
  return `${placementOf(pos.board)} ${side} - ${fourth} ${fifth} ${pos.fullmove}`;
}
