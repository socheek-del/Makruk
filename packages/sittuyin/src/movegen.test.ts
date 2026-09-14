import { describe, expect, it } from 'vitest';
import { Game, moveToUci } from './game';

const allUci = (fen: string) => new Game(fen).legalMoves().map(moveToUci).sort();
/** Destination squares of non-promotion moves from `from`. */
const targets = (fen: string, from: string) =>
  allUci(fen)
    .filter((u) => u.startsWith(from) && !u.endsWith('f'))
    .map((u) => u.slice(2, 4))
    .sort();
const promotions = (fen: string) => allUci(fen).filter((u) => u.endsWith('f'));
const sanOf = (fen: string, uci: string) => new Game(fen).move(uci).san;

describe('piece movement (sit-002)', () => {
  it('Min-gyi moves one step in any direction', () => {
    expect(targets('7k/8/8/8/3K4/8/8/8[] w - - 0 1', 'd4')).toEqual(['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5']);
  });

  it('Sit-ke moves one step diagonally', () => {
    expect(targets('7k/8/8/8/3F4/8/8/K7[] w - - 0 1', 'd4')).toEqual(['c3', 'c5', 'e3', 'e5']);
  });

  it('White Sin moves one step diagonally or straight forward', () => {
    expect(targets('7k/8/8/8/3S4/8/8/K7[] w - - 0 1', 'd4')).toEqual(['c3', 'c5', 'd5', 'e3', 'e5']);
  });

  it('Black Sin moves forward toward rank 1', () => {
    expect(targets('7k/8/8/3s4/8/8/8/K7[] b - - 0 1', 'd5')).toEqual(['c4', 'c6', 'd4', 'e4', 'e6']);
  });

  it('Myin jumps like a knight', () => {
    expect(targets('7k/8/8/8/3N4/8/8/K7[] w - - 0 1', 'd4')).toEqual(['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5']);
  });

  it('Yahhta slides along ranks and files, stopping at blockers', () => {
    expect(targets('7k/8/8/8/3R4/8/8/K7[] w - - 0 1', 'd4')).toHaveLength(14);
    expect(targets('7k/8/8/3p4/1N1R4/8/8/K7[] w - - 0 1', 'd4')).toEqual([
      'c4', 'd1', 'd2', 'd3', 'd5', 'e4', 'f4', 'g4', 'h4',
    ]);
  });

  it('Ne moves one step forward and captures diagonally forward', () => {
    expect(targets('7k/8/8/8/3p1p2/4P3/8/K7[] w - - 0 1', 'e3')).toEqual(['d4', 'e4', 'f4']);
    expect(targets('7k/8/8/8/3pnp2/4P3/8/K7[] w - - 0 1', 'e3')).toEqual(['d4', 'f4']);
    expect(targets('7k/8/8/4p3/8/8/8/K7[] b - - 0 1', 'e5')).toEqual(['e4']);
  });
});

describe('legality (sit-002)', () => {
  it('a pinned piece cannot move', () => {
    expect(targets('k3r3/8/8/8/8/8/4N3/4K3[] w - - 0 1', 'e2')).toEqual([]);
  });

  it('only check-escaping moves are legal when in check', () => {
    expect(allUci('4r2k/8/8/8/8/8/R7/4K3[] w - - 0 1')).toEqual(['a2e2', 'e1d1', 'e1d2', 'e1f1', 'e1f2']);
  });

  it('Min-gyi cannot step next to the other Min-gyi', () => {
    expect(targets('8/8/3k4/8/3K4/8/8/8[] w - - 0 1', 'd4')).toEqual(['c3', 'c4', 'd3', 'e3', 'e4']);
  });
});

// Every expectation below was probed with Fairy-Stockfish's sittuyin variant (ffish 0.7.10).
describe('Ne promotion (sit-002)', () => {
  it('promotes on a promotion square, in place or onto an empty diagonal neighbour in any direction', () => {
    expect(promotions('4k3/8/8/3P4/8/8/P7/4K3[] w - - 0 1')).toEqual(['d5c4f', 'd5c6f', 'd5d5f', 'd5e4f', 'd5e6f']);
    expect(promotions('4k3/p7/8/8/3p4/8/8/4K3[] b - - 0 1')).toEqual(['d4c3f', 'd4c5f', 'd4d4f', 'd4e3f', 'd4e5f']);
    expect(promotions('P3k3/8/8/8/8/8/P7/4K3[] w - - 0 1')).toEqual(['a8a8f', 'a8b7f']);
  });

  it("uses only its own side's promotion squares while several Ne remain", () => {
    expect(promotions('4k3/8/8/8/3P4/8/P7/4K3[] w - - 0 1')).toEqual([]);
    expect(promotions('4k3/p7/8/3p4/8/8/8/4K3[] b - - 0 1')).toEqual([]);
  });

  it('a last Ne may promote on any square', () => {
    expect(promotions('4k3/8/8/8/P7/8/8/4K3[] w - - 0 1')).toEqual(['a4a4f', 'a4b3f', 'a4b5f']);
  });

  it('no promotion while the side has a Sit-ke', () => {
    expect(promotions('4k3/8/8/8/P7/8/8/4KF2[] w - - 0 1')).toEqual([]);
  });

  it('occupied diagonal squares leave only promotion in place', () => {
    expect(promotions('4k3/8/2N1N3/3P4/2N1N3/8/P7/4K3[] w - - 0 1')).toEqual(['d5d5f']);
  });

  it('the new Sit-ke may not attack an enemy piece', () => {
    expect(promotions('4k3/8/2n1n3/3P4/2n1n3/8/P7/K7[] w - - 0 1')).toEqual([]);
  });

  it('a promotion never gives check, not even a discovered one', () => {
    expect(promotions('8/1k6/8/3P4/8/8/P7/4K3[] w - - 0 1')).toEqual(['d5c4f', 'd5d5f', 'd5e4f', 'd5e6f']);
    expect(promotions('8/8/8/3P4/2k5/8/P7/4K3[] w - - 0 1')).toEqual(['d5c6f', 'd5e4f', 'd5e6f']);
    expect(promotions('3k4/8/8/3P4/8/8/P7/3RK3[] w - - 0 1')).toEqual(['d5d5f']);
  });

  it('a promotion may block a check; a pinned Ne promotes only in place', () => {
    expect(promotions('k2r4/8/8/4P3/8/8/P7/3K4[] w - - 0 1')).toEqual(['e5d4f', 'e5d6f']);
    expect(promotions('3rk3/8/8/3P4/8/8/P7/3K4[] w - - 0 1')).toEqual(['d5d5f']);
  });

  it('records a promotion, resets the halfmove clock and undoes it', () => {
    const fen = '4k3/8/8/3P4/8/8/P7/4K3[] w - - 3 20';
    const game = new Game(fen);
    const record = game.move('d5c4f');
    expect(record).toMatchObject({
      kind: 'move',
      promotion: true,
      uci: 'd5c4f',
      san: 'd5c4=F',
      piece: { color: 'w', type: 'p', promoted: false },
      captured: null,
    });
    expect(game.fen()).toBe('4k3/8/8/8/2F~5/8/P7/4K3[] b - - 0 20');
    expect(game.pieceAt(26)).toEqual({ color: 'w', type: 'f', promoted: true });
    game.move('e8d7');
    expect(promotions(game.fen())).toEqual([]);
    game.undo();
    game.undo();
    expect(game.fen()).toBe(fen);

    const inPlace = new Game(fen);
    expect(inPlace.move('d5d5f').san).toBe('d5=F');
    expect(inPlace.fen()).toBe('4k3/8/8/3F~4/8/8/P7/4K3[] b - - 0 20');
    inPlace.undo();
    expect(inPlace.fen()).toBe(fen);
  });
});

describe('SAN like Fairy-Stockfish (sit-002)', () => {
  it.each([
    ['4k3/8/8/8/8/8/P7/1N2KN2[] w - - 0 1', 'b1d2', 'Nbd2'],
    ['4k3/8/8/8/8/8/P7/1N2KN2[] w - - 0 1', 'f1d2', 'Nfd2'],
    ['4k3/8/8/3p4/4P3/8/P7/4K3[] w - - 0 1', 'e4d5', 'exd5'],
    ['4k3/8/8/3p4/4P3/8/P7/4K3[] w - - 0 1', 'e4e5', 'e5'],
    ['4k3/8/8/8/8/2F1S3/P7/4K3[] w - - 0 1', 'c3d4', 'Fd4'],
    ['4k3/8/8/8/8/2F1S3/P7/4K3[] w - - 0 1', 'e3f4', 'Sf4'],
    ['4k3/8/8/8/8/8/P3n3/4K3[] w - - 0 1', 'e1e2', 'Kxe2'],
    ['k2r4/8/8/4P3/8/8/P7/3K4[] w - - 0 1', 'e5d4f', 'e5d4=F'],
  ])('%s %s → %s', (fen, uci, san) => {
    expect(sanOf(fen, uci)).toBe(san);
  });
});
