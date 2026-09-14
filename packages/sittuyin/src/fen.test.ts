import { KING, ROOK } from '@makruk/engine/core';
import { describe, expect, it } from 'vitest';
import { FenError, parseFen, serializeFen, START_FEN } from './fen';

const roundTrip = (fen: string) => serializeFen(parseFen(fen));

describe('FEN round trip', () => {
  // Positions written by Fairy-Stockfish (ffish 0.7.10) during setup and play.
  const positions = [
    START_FEN,
    '8/8/4pppp/pppp4/4PPPP/PPPP3K/8/8[SSFRRNNkssfrrnn] b - - 0 1',
    'kn5r/8/4pppp/pppp4/4PPPP/PPPPN2K/8/5N2[SSFRRssfrn] w - - 0 4',
    'kn5r/2n2f2/4pppp/pppp4/4PPPP/PPPPNS1K/3S3F/5N2[RRssr] b - - 0 6',
    'kn2r2r/2ns1f2/4pppp/pppp4/4PPPP/PPPPNS1K/3S3F/3R1N1R[s] b - - 0 8',
    'kn2rs1r/2ns1f2/4pppp/pppp4/4PPPP/PPPPNS1K/3S3F/3R1N1R[] w - - 0 9',
    '1f1rsnnr/2k3s1/4pppp/pppp4/4PPPP/PPPPK3/S2S1N1F/N2R1R2[] w - - 0 9',
    '8/8/8/k1K4p/7P/8/5F2/N7[] b - - 0 41',
    '8/8/2k4S/8/4S3/8/2KF4/8[] w - 88 89 101',
    'k6P/8/8/8/8/8/8/K7[] w - - 0 1',
    '4k3/8/8/8/8/8/8/R6K[] b - 32 0 10',
    '4k3/8/8/8/8/8/8/4R3[K] b - 32 0 1',
    '8/8/8/8/8/8/8/8[Kk] w - - 0 1',
    'k7/8/8/8/8/8/8/K5F~1[] w - - 0 1',
  ];

  it.each(positions)('%s', (fen) => {
    expect(roundTrip(fen)).toBe(fen);
  });

  it('fills in missing trailing fields and an absent hand', () => {
    expect(roundTrip('8/8/4pppp/pppp4/4PPPP/PPPP4/8/8[KSSFRRNNkssfrrnn] w')).toBe(START_FEN);
    expect(roundTrip('k7/8/8/8/8/8/8/K7 w - - 0 1')).toBe('k7/8/8/8/8/8/8/K7[] w - - 0 1');
  });

  it('writes pieces in hand in Fairy-Stockfish order', () => {
    expect(roundTrip('8/8/4pppp/pppp4/4PPPP/PPPP4/8/8[FKRRSSNNkfrrssnn] w - - 0 1')).toBe(START_FEN);
  });

  it('counts pieces in hand per colour', () => {
    const { hands } = parseFen(START_FEN);
    expect([hands[0][KING], hands[0][ROOK], hands[1][KING], hands[1][ROOK]]).toEqual([1, 2, 1, 2]);
  });
});

describe('invalid FEN', () => {
  const invalid: Array<[string, string]> = [
    ['empty', ''],
    ['one field', START_FEN.split(' ')[0]!],
    ['seven ranks', '8/4pppp/pppp4/4PPPP/PPPP4/8/8[KSSFRRNNkssfrrnn] w - - 0 1'],
    ['nine squares in a rank', 'k8/8/8/8/8/8/8/K7[] w - - 0 1'],
    ['short rank', 'k6/8/8/8/8/8/8/K7[] w - - 0 1'],
    ['Makruk Met letter', 'k7/8/8/8/8/8/8/K5M1[] w - - 0 1'],
    ['queen in hand', 'k7/8/8/8/8/8/8/K7[Q] w - - 0 1'],
    ['Ne in hand', 'k7/8/8/8/8/8/8/K7[P] w - - 0 1'],
    ['Min-gyi on board and in hand', 'k7/8/8/8/8/8/8/7K[K] w - - 0 1'],
    ['no white Min-gyi', '8/8/4pppp/pppp4/4PPPP/PPPP4/8/8[] w - - 0 1'],
    ['two hand groups', 'k7/8/8/8/8/8/8/K7[][] w - - 0 1'],
    ['unclosed hand', 'k7/8/8/8/8/8/8/K7[R w - - 0 1'],
    ['bad side to move', 'k7/8/8/8/8/8/8/K7[] x - - 0 1'],
    ['castling rights', 'k7/8/8/8/8/8/8/K7[] w KQ - 0 1'],
    ['en passant square', 'k7/8/8/8/8/8/8/K7[] w - e3 0 1'],
    ['non-numeric halfmove', 'k7/8/8/8/8/8/8/K7[] w - - x 1'],
    ['non-numeric fullmove', 'k7/8/8/8/8/8/8/K7[] w - - 0 y'],
    ['side not to move in check', '4k3/8/8/8/8/8/8/4R1K1[] w - - 0 1'],
    ['promotion marker on a Yahhta', 'k7/8/8/8/8/8/8/K5R~1[] w - - 0 1'],
  ];

  it.each(invalid)('rejects %s', (_label, fen) => {
    expect(() => parseFen(fen)).toThrow(FenError);
  });
});
