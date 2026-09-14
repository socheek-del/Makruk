import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { sittuyin } from './variant';

describeVariantConformance(sittuyin, {
  fens: [
    'kn5r/2n2f2/4pppp/pppp4/4PPPP/PPPPNS1K/3S3F/5N2[RRssr] b - - 0 6',
    '1f1rsnnr/2k3s1/4pppp/pppp4/4PPPP/PPPPK3/S2S1N1F/N2R1R2[] w - - 0 9',
    '4k3/8/8/8/8/8/8/R6K[] b - 32 0 10',
    'k7/8/8/8/8/8/8/K5F~1[] w - - 0 1',
  ],
  invalidFens: ['', 'k7/8/8/8/8/8/8/K7[P] w - - 0 1', '4k3/8/8/8/8/8/8/4R1K1[] w - - 0 1'],
  illegalMoves: ['e3e4', 'R@a2', 'P@a2', 'zz'],
  checkmate: { fen: 'k7/2K5/8/8/8/8/8/7R[] w - - 0 1', move: 'h1a1', winner: 'w' },
});
