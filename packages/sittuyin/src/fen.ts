/**
 * Sittuyin FEN, compatible with Fairy-Stockfish:
 *   <placement>[<pieces in hand>] <side> - <-|countingLimit> <halfmove|countingPly> <fullmove>
 * Sit-ke = f, Sin = s. Pieces in hand are listed White (upper case) then Black, each in
 * Fairy-Stockfish order K S F R N. A promoted Ne is written as a Sit-ke followed by `~`.
 */
import {
  BLACK,
  type Board,
  type ColorIndex,
  findKing,
  isAttacked,
  KING,
  MET,
  PAWN,
  PROMOTED,
} from '@makruk/engine/core';
import { codeToChar, emptyHands, HAND_ORDER, type Hands, typeFromChar } from './board';

export const START_FEN = '8/8/4pppp/pppp4/4PPPP/PPPP4/8/8[KSSFRRNNkssfrrnn] w - - 0 1';

export interface PositionData {
  board: Board;
  hands: Hands;
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
const PLACEMENT = /^([^[\]]*)(?:\[([^[\]]*)\])?$/;

export function parseFen(fen: string): PositionData {
  const fields = fen.trim().split(/\s+/);
  if (fields.length < 2 || fields.length > 6) throw new FenError('FEN must have between 2 and 6 fields', fen);
  const [placementField = '', side = '', castling = '-', fourth = '-', half = '0', full = '1'] = fields;

  const match = PLACEMENT.exec(placementField);
  if (!match) throw new FenError('Pieces in hand must be a single [...] group after the placement', fen);
  const rows = match[1]!.split('/');
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
        if (type !== MET) throw new FenError("Only a Sit-ke can be marked promoted with '~'", fen);
        code |= PROMOTED;
        j++;
      }
      board[rank * 8 + file] = code;
      file++;
    }
    if (file !== 8) throw new FenError(`Rank ${rank + 1} does not have exactly 8 squares`, fen);
  });

  const hands = emptyHands();
  for (const ch of match[2] ?? '') {
    const type = typeFromChar(ch);
    if (!type) throw new FenError(`Invalid piece character '${ch}' in hand`, fen);
    if (type === PAWN) throw new FenError('A Ne cannot be in hand', fen);
    const hand = hands[ch === ch.toLowerCase() ? 1 : 0];
    hand[type] = hand[type]! + 1;
  }

  for (const c of [0, 1] as const) {
    const code = KING | (c ? BLACK : 0);
    const kings = board.filter((p) => p === code).length + hands[c][KING]!;
    if (kings !== 1) {
      throw new FenError(`${c ? 'Black' : 'White'} must have exactly one Min-gyi on the board or in hand`, fen);
    }
  }

  if (side !== 'w' && side !== 'b') throw new FenError("Side to move must be 'w' or 'b'", fen);
  const turn: ColorIndex = side === 'b' ? 1 : 0;
  if (castling !== '-') throw new FenError("Castling field must be '-' in Sittuyin", fen);

  let countingLimit = 0;
  if (DIGITS.test(fourth)) countingLimit = Number(fourth);
  else if (fourth !== '-') throw new FenError('Sittuyin has no en passant; 4th field must be - or a counting limit', fen);

  if (!DIGITS.test(half)) throw new FenError('Halfmove/counting field must be a number', fen);
  if (!DIGITS.test(full)) throw new FenError('Fullmove field must be a number', fen);

  let rule50 = Number(half);
  let countingPly = 0;
  if (countingLimit && rule50) {
    countingPly = rule50;
    rule50 = 0;
  }

  const opponentKing = findKing(board, turn === 0 ? 1 : 0);
  if (opponentKing >= 0 && isAttacked(board, opponentKing, turn)) {
    throw new FenError('The side not to move is in check', fen);
  }

  return { board, hands, turn, countingLimit, countingPly, rule50, fullmove: Math.max(Number(full), 1) };
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

export function handsOf(hands: Hands): string {
  let out = '';
  for (const c of [0, 1] as const) {
    for (const type of HAND_ORDER) out += codeToChar(type | (c ? BLACK : 0)).repeat(hands[c][type]!);
  }
  return out;
}

export function serializeFen(pos: PositionData): string {
  const side = pos.turn === 1 ? 'b' : 'w';
  const fourth = pos.countingLimit ? String(pos.countingLimit) : '-';
  const fifth = pos.countingLimit ? pos.countingPly : pos.rule50;
  return `${placementOf(pos.board)}[${handsOf(pos.hands)}] ${side} - ${fourth} ${fifth} ${pos.fullmove}`;
}
