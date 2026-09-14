import { describe, expect, it } from 'vitest';
import { findKing, inCheck, isAttacked } from './attacks';
import {
  BLACK,
  FERZ,
  FERZ_TARGETS,
  KING,
  KING_TARGETS,
  KNIGHT_TARGETS,
  PAWN,
  PAWN_CAPTURES,
  parseSquare as sq,
  ROOK,
  ROOK_RAYS,
  SILVER,
  SILVER_TARGETS,
  squareName,
} from './board8';

const names = (squares: readonly number[]) => squares.map(squareName).sort();

function boardWith(pieces: Record<string, number>): Uint8Array {
  const board = new Uint8Array(64);
  for (const [name, code] of Object.entries(pieces)) board[sq(name)] = code;
  return board;
}

describe('squares', () => {
  it('names a1..h8 as 0..63 and rejects other names', () => {
    expect([squareName(0), squareName(7), squareName(56), squareName(63)]).toEqual(['a1', 'h1', 'a8', 'h8']);
    for (let s = 0; s < 64; s++) expect(sq(squareName(s))).toBe(s);
    expect([sq('i1'), sq('a9'), sq('A1'), sq('')]).toEqual([-1, -1, -1, -1]);
  });
});

describe('move tables', () => {
  it('leapers stay on the board', () => {
    expect(names(KNIGHT_TARGETS[sq('a1')]!)).toEqual(['b3', 'c2']);
    expect(KNIGHT_TARGETS[sq('d4')]).toHaveLength(8);
    expect(names(KING_TARGETS[sq('h8')]!)).toEqual(['g7', 'g8', 'h7']);
    expect(names(FERZ_TARGETS[sq('d4')]!)).toEqual(['c3', 'c5', 'e3', 'e5']);
  });

  it('silver generals and pawns face their own forward direction', () => {
    expect(names(SILVER_TARGETS[0][sq('d4')]!)).toEqual(['c3', 'c5', 'd5', 'e3', 'e5']);
    expect(names(SILVER_TARGETS[1][sq('d4')]!)).toEqual(['c3', 'c5', 'd3', 'e3', 'e5']);
    expect(names(PAWN_CAPTURES[0][sq('a2')]!)).toEqual(['b3']);
    expect(names(PAWN_CAPTURES[1][sq('d4')]!)).toEqual(['c3', 'e3']);
  });

  it('rook rays run outward to the edge', () => {
    expect(ROOK_RAYS[sq('d4')]!.flat()).toHaveLength(14);
    expect(ROOK_RAYS[sq('a1')]!.map((ray) => ray.length).sort()).toEqual([0, 0, 7, 7]);
  });
});

describe('attacks', () => {
  it('detects each piece type attacking a square', () => {
    const e4 = sq('e4');
    expect(isAttacked(boardWith({ d3: PAWN }), e4, 0)).toBe(true);
    expect(isAttacked(boardWith({ d5: PAWN | BLACK }), e4, 1)).toBe(true);
    expect(isAttacked(boardWith({ d5: PAWN }), e4, 0)).toBe(false);
    expect(isAttacked(boardWith({ d3: FERZ }), e4, 0)).toBe(true);
    expect(isAttacked(boardWith({ e3: SILVER }), e4, 0)).toBe(true);
    expect(isAttacked(boardWith({ e5: SILVER }), e4, 0)).toBe(false);
    expect(isAttacked(boardWith({ e5: SILVER | BLACK }), e4, 1)).toBe(true);
    expect(isAttacked(boardWith({ e8: ROOK }), e4, 0)).toBe(true);
    expect(isAttacked(boardWith({ e8: ROOK, e6: PAWN | BLACK }), e4, 0)).toBe(false);
    expect(isAttacked(boardWith({ f5: KING }), e4, 0)).toBe(true);
  });

  it('a missing king is never in check', () => {
    const board = boardWith({ e8: ROOK | BLACK });
    expect(findKing(board, 0)).toBe(-1);
    expect(inCheck(board, 0)).toBe(false);
    board[sq('e1')] = KING;
    expect(findKing(board, 0)).toBe(sq('e1'));
    expect(inCheck(board, 0)).toBe(true);
  });
});
