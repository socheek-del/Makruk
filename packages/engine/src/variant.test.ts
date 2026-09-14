import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { makruk } from './variant';

describeVariantConformance(makruk, {
  fens: [
    '4k3/8/M~7/8/8/8/8/4K3 b - 128 6 1',
    'r1smks1r/8/1ppnpnpp/p2p4/4P3/PPPP1PPP/3N4/R1SKMSNR w - - 2 6',
    '8/2k5/3m~4/8/8/4S3/2K5/8 w - 44 20 60',
  ],
  invalidFens: ['', 'rnsqksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1', '4k3/8/8/8/8/8/8/4R1K1 w - - 0 1'],
  illegalMoves: ['e3e5', 'e2e4', 'zz', 'K@e1'],
  checkmate: { fen: 'k7/2R5/8/8/8/8/8/4K2R w - - 0 1', move: 'h1h8', winner: 'w' },
});
