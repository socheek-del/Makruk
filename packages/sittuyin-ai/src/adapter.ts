import type { SearchAdapter } from '@chaturanga/ai-core';
import { inCheck, TYPE_MASK } from '@chaturanga/rules-core';
import {
  generateLegalMoves,
  handsOf,
  isDrop,
  isPromotion,
  makeRaw,
  moveFrom,
  moveTo,
  placementOf,
  type Position,
  unmakeRaw,
} from '@chaturanga/sittuyin/core';
import { evaluate, PIECE_VALUE } from './evaluate';

/** Position identity for repetition: placement with hands, and side to move (the first two FEN fields). */
export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 2).join(' ');
}

/** Sittuyin position walked by the ai-core search. Takes ownership of `pos` (pass a fresh parse). */
export class SittuyinSearch implements SearchAdapter {
  /** Flat undo stack of (move, moved piece, captured piece) triples. */
  private readonly undo: number[] = [];

  constructor(private readonly pos: Position) {}

  turn() {
    return this.pos.turn;
  }

  legalMoves() {
    return generateLegalMoves(this.pos);
  }

  make(move: number) {
    const mover = this.pos.turn;
    const moved = isDrop(move) ? 0 : this.pos.board[moveFrom(move)]!;
    const captured = makeRaw(this.pos, move, mover);
    this.undo.push(move, moved, captured);
    this.pos.turn = mover === 0 ? 1 : 0;
  }

  unmake() {
    const captured = this.undo.pop()!;
    const moved = this.undo.pop()!;
    const move = this.undo.pop()!;
    this.pos.turn = this.pos.turn === 0 ? 1 : 0;
    unmakeRaw(this.pos, move, this.pos.turn, moved, captured);
  }

  inCheck() {
    return inCheck(this.pos.board, this.pos.turn);
  }

  evaluate() {
    return evaluate(this.pos, this.pos.turn);
  }

  isTactical(move: number) {
    return !isDrop(move) && (isPromotion(move) || this.captures(move));
  }

  orderKey(move: number) {
    if (isDrop(move)) return 0;
    let key = 0;
    if (this.captures(move)) {
      key += 10 * PIECE_VALUE[this.pos.board[moveTo(move)]! & TYPE_MASK]! - PIECE_VALUE[this.pos.board[moveFrom(move)]! & TYPE_MASK]!;
    }
    if (isPromotion(move)) key += 500;
    return key;
  }

  key() {
    return `${placementOf(this.pos.board)}[${handsOf(this.pos.hands)}] ${this.pos.turn === 0 ? 'w' : 'b'}`;
  }

  private captures(move: number) {
    return moveFrom(move) !== moveTo(move) && this.pos.board[moveTo(move)] !== 0;
  }
}
