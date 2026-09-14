import {
  BLACK,
  type ColorIndex,
  colorBits,
  fileOf,
  inCheck,
  KING,
  parseSquare,
  PAWN,
  rankOf,
  squareName,
  toColor,
  TYPE_MASK,
} from '@makruk/engine/core';
import { codeToPiece, HAND_ORDER, handCount, typeFromChar } from './board';
import { parseFen, serializeFen, START_FEN } from './fen';
import {
  dropType,
  encodeDrop,
  encodeMove,
  generateLegalMoves,
  isDrop,
  isPromotion,
  makeRaw,
  moveFrom,
  moveTo,
  type Position,
  PROMOTION_FLAG,
  unmakeRaw,
} from './movegen';
import type { Color, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';

export class IllegalMoveError extends Error {
  constructor(readonly move: string) {
    super(`Illegal move: ${move}`);
    this.name = 'IllegalMoveError';
  }
}

interface HistoryEntry {
  move: number;
  moved: number;
  captured: number;
  rule50: number;
  countingLimit: number;
  countingPly: number;
  fullmove: number;
  record: MoveRecord;
}

const SAN_LETTER = ['', '', 'N', 'S', 'F', 'R', 'K'];
const UCI = /^(?:([KSFRN])@([a-h][1-8])|([a-h][1-8])([a-h][1-8])(f?))$/;

export class Game {
  private readonly pos: Position;
  private countingLimit: number;
  private countingPly: number;
  private rule50: number;
  private fullmove: number;
  private readonly history: HistoryEntry[] = [];

  constructor(fen: string = START_FEN) {
    const data = parseFen(fen);
    this.pos = { board: data.board, hands: data.hands, turn: data.turn };
    this.countingLimit = data.countingLimit;
    this.countingPly = data.countingPly;
    this.rule50 = data.rule50;
    this.fullmove = data.fullmove;
  }

  get turn(): Color {
    return toColor(this.pos.turn);
  }

  fen(): string {
    return serializeFen({
      ...this.pos,
      countingLimit: this.countingLimit,
      countingPly: this.countingPly,
      rule50: this.rule50,
      fullmove: this.fullmove,
    });
  }

  pieceAt(square: Square): Piece | null {
    const p = this.pos.board[square];
    return p ? codeToPiece(p) : null;
  }

  pieces(): Array<{ square: Square; piece: Piece }> {
    const out: Array<{ square: Square; piece: Piece }> = [];
    this.pos.board.forEach((p, square) => {
      if (p) out.push({ square, piece: codeToPiece(p) });
    });
    return out;
  }

  /** Pieces a side still has to place, in Fairy-Stockfish order, e.g. ['k', 's', 's', 'f', 'r', 'r', 'n', 'n']. */
  hand(color: Color): PieceType[] {
    const hand = this.pos.hands[color === 'b' ? 1 : 0];
    return HAND_ORDER.flatMap((type) => Array<PieceType>(hand[type]!).fill(codeToPiece(type).type));
  }

  /** True until both sides have placed every piece from hand. */
  inSetup(): boolean {
    return handCount(this.pos.hands[0]) + handCount(this.pos.hands[1]) > 0;
  }

  legalMoves(): Move[] {
    return generateLegalMoves(this.pos).map(toMove);
  }

  legalMovesFrom(square: Square): Move[] {
    return this.legalMoves().filter((m) => m.kind === 'move' && m.from === square);
  }

  inCheck(): boolean {
    return inCheck(this.pos.board, this.pos.turn);
  }

  /** Square of the side-to-move's Min-gyi if it is in check, otherwise null. */
  checkedKingSquare(): Square | null {
    if (!this.inCheck()) return null;
    return this.pos.board.findIndex((p) => p === (KING | colorBits(this.pos.turn)));
  }

  moves(): MoveRecord[] {
    return this.history.map((h) => h.record);
  }

  lastMove(): MoveRecord | null {
    return this.history.at(-1)?.record ?? null;
  }

  /** Accepts a Move or coordinate notation (`K@h3`, `e3e4`, `h5g4f`). */
  move(input: Move | string): MoveRecord {
    const legal = generateLegalMoves(this.pos);
    const encoded = resolve(input, legal);
    if (encoded === undefined) throw new IllegalMoveError(typeof input === 'string' ? input : moveToUci(input));

    const mover = this.pos.turn;
    const moved = isDrop(encoded) ? dropType(encoded) | colorBits(mover) : this.pos.board[moveFrom(encoded)]!;
    const sanBase = this.sanBase(encoded, legal, moved);
    const entry: Omit<HistoryEntry, 'record' | 'captured'> = {
      move: encoded,
      moved,
      rule50: this.rule50,
      countingLimit: this.countingLimit,
      countingPly: this.countingPly,
      fullmove: this.fullmove,
    };

    this.rule50++;
    if (this.countingLimit) this.countingPly++;
    const captured = makeRaw(this.pos, encoded, mover);
    if (captured || isDrop(encoded) || (moved & TYPE_MASK) === PAWN) this.rule50 = 0;
    if (mover === 1) this.fullmove++;
    this.pos.turn = mover === 0 ? 1 : 0;

    const replies = generateLegalMoves(this.pos);
    const check = inCheck(this.pos.board, this.pos.turn);
    const move = toMove(encoded);
    const record: MoveRecord = {
      ...move,
      uci: moveToUci(move),
      san: sanBase + (check ? (replies.length === 0 ? '#' : '+') : ''),
      piece: codeToPiece(moved),
      captured: captured ? codeToPiece(captured) : null,
      color: toColor(mover),
      fenAfter: this.fen(),
    };
    this.history.push({ ...entry, captured, record });
    return record;
  }

  undo(): MoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    const mover: ColorIndex = entry.moved & BLACK ? 1 : 0;
    unmakeRaw(this.pos, entry.move, mover, entry.moved, entry.captured);
    this.pos.turn = mover;
    this.rule50 = entry.rule50;
    this.countingLimit = entry.countingLimit;
    this.countingPly = entry.countingPly;
    this.fullmove = entry.fullmove;
    return entry.record;
  }

  status(): GameStatus {
    if (generateLegalMoves(this.pos).length > 0) return { kind: 'ongoing' };
    return this.inCheck() ? { kind: 'checkmate', winner: toColor(this.pos.turn === 0 ? 1 : 0) } : { kind: 'stalemate' };
  }

  isGameOver(): boolean {
    return this.status().kind !== 'ongoing';
  }

  private sanBase(m: number, legal: number[], moved: number): string {
    const to = moveTo(m);
    const target = squareName(to);
    if (isDrop(m)) return `${SAN_LETTER[dropType(m)]}@${target}`;

    const from = moveFrom(m);
    const type = moved & TYPE_MASK;
    const capture = from !== to && this.pos.board[to] !== 0;
    const promo = isPromotion(m) ? '=F' : '';
    if (type === PAWN) return (capture ? `${'abcdefgh'[fileOf(from)]}x` : '') + target + promo;

    const rivals = legal.filter(
      (o) => o !== m && !isDrop(o) && moveTo(o) === to && this.pos.board[moveFrom(o)] === moved,
    );
    let disambiguation = '';
    if (rivals.length) {
      const sameFile = rivals.some((o) => fileOf(moveFrom(o)) === fileOf(from));
      const sameRank = rivals.some((o) => rankOf(moveFrom(o)) === rankOf(from));
      if (!sameFile) disambiguation = 'abcdefgh'[fileOf(from)]!;
      else if (!sameRank) disambiguation = String(rankOf(from) + 1);
      else disambiguation = squareName(from);
    }
    return `${SAN_LETTER[type]}${disambiguation}${capture ? 'x' : ''}${target}`;
  }
}

function resolve(input: Move | string, legal: number[]): number | undefined {
  let target: number;
  if (typeof input === 'string') {
    const m = UCI.exec(input);
    if (!m) return undefined;
    target = m[1]
      ? encodeDrop(typeFromChar(m[1]), parseSquare(m[2]!))
      : encodeMove(parseSquare(m[3]!), parseSquare(m[4]!), m[5] ? PROMOTION_FLAG : 0);
  } else {
    target =
      input.kind === 'drop'
        ? encodeDrop(typeFromChar(input.type), input.to)
        : encodeMove(input.from, input.to, input.promotion ? PROMOTION_FLAG : 0);
  }
  return legal.includes(target) ? target : undefined;
}

function toMove(m: number): Move {
  if (isDrop(m)) return { kind: 'drop', type: codeToPiece(dropType(m)).type, to: moveTo(m) };
  return { kind: 'move', from: moveFrom(m), to: moveTo(m), promotion: isPromotion(m) };
}

export function moveToUci(m: Move): string {
  if (m.kind === 'drop') return `${m.type.toUpperCase()}@${squareName(m.to)}`;
  return squareName(m.from) + squareName(m.to) + (m.promotion ? 'f' : '');
}
