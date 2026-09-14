import { describe, expect, it } from 'vitest';
import { FenError, parseFen, serializeFen, START_FEN } from './fen';

const roundTrip = (fen: string) => serializeFen(parseFen(fen));

describe('FEN round trip', () => {
  const positions = [
    START_FEN,
    '4k3/8/8/P7/8/8/8/4K3 w - - 0 1',
    '4k3/8/M~7/8/8/8/8/4K3 b - 128 6 1',
    '4k3/8/8/8/8/8/R7/4K3 b - 32 6 1',
    '3k4/8/8/8/8/8/R7/4K3 w - 32 7 2',
    '4k3/3m4/8/8/8/2N5/8/R3K3 b - 128 0 1',
    'R6k/1R6/8/8/8/8/8/4K3 b - - 0 1',
    '7k/R7/8/8/8/8/8/4K1R1 b - - 0 1',
    'rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 8 5',
    'r1smks1r/8/1ppnpnpp/p2p4/4P3/PPPP1PPP/3N4/R1SKMSNR w - - 2 6',
    '8/2k5/3m~4/8/8/4S3/2K5/8 w - 44 20 60',
    '2r1k3/8/8/8/8/8/8/3K4 w - 32 10 40',
  ];

  it.each(positions)('%s', (fen) => {
    expect(roundTrip(fen)).toBe(fen);
  });

  it('fills in missing trailing fields', () => {
    expect(roundTrip('rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w')).toBe(START_FEN);
  });

  it('reads counting fields into limit and ply', () => {
    const pos = parseFen('4k3/8/8/8/8/8/R7/4K3 b - 32 6 1');
    expect(pos.countingLimit).toBe(32);
    expect(pos.countingPly).toBe(6);
    expect(pos.rule50).toBe(0);
  });

  it('marks promoted Met pieces', () => {
    const pos = parseFen('4k3/8/M~7/8/8/8/8/4K3 b - 128 6 1');
    expect(pos.board[40]! & 16).toBe(16);
  });
});

describe('invalid FEN', () => {
  const invalid: Array<[string, string]> = [
    ['empty', ''],
    ['one field', 'rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR'],
    ['seven ranks', 'rnsmksnr/8/pppppppp/8/PPPPPPPP/8/RNSKMSNR w - - 0 1'],
    ['nine squares in a rank', 'rnsmksnrr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1'],
    ['short rank', 'rnsmksn/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1'],
    ['queen is not a Makruk piece', 'rnsqksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1'],
    ['two white kings', '4k3/8/8/8/8/8/8/3KK3 w - - 0 1'],
    ['missing black king', '8/8/8/8/8/8/8/4K3 w - - 0 1'],
    ['white Bia on promotion rank', '4k3/8/P7/8/8/8/8/4K3 w - - 0 1'],
    ['black Bia on promotion rank', '4k3/8/8/8/8/p7/8/4K3 w - - 0 1'],
    ['bad side to move', '4k3/8/8/8/8/8/8/4K3 x - - 0 1'],
    ['castling rights', '4k3/8/8/8/8/8/8/4K3 w KQ - 0 1'],
    ['en passant square', '4k3/8/8/8/8/8/8/4K3 w - e3 0 1'],
    ['non-numeric halfmove', '4k3/8/8/8/8/8/8/4K3 w - - x 1'],
    ['non-numeric fullmove', '4k3/8/8/8/8/8/8/4K3 w - - 0 y'],
    ['side not to move in check', '4k3/8/8/8/8/8/8/4R1K1 w - - 0 1'],
    ['promotion marker on a rook', '4k3/8/R~7/8/8/8/8/4K3 w - - 0 1'],
  ];

  it.each(invalid)('rejects %s', (_label, fen) => {
    expect(() => parseFen(fen)).toThrow(FenError);
  });
});
