import { describe, expect, it } from 'vitest';
import { parseSquare, squareName } from './board';
import { Game, moveToUci } from './game';

const targets = (fen: string, from: string) =>
  new Game(fen)
    .legalMovesFrom(parseSquare(from))
    .map((m) => squareName(m.to))
    .sort();

const allUci = (fen: string) => new Game(fen).legalMoves().map(moveToUci).sort();

describe('piece movement', () => {
  it('Khun moves one step in any direction', () => {
    expect(targets('7k/8/8/8/3K4/8/8/8 w - - 0 1', 'd4')).toEqual(['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5']);
  });

  it('Met moves one step diagonally', () => {
    expect(targets('7k/8/8/8/3M4/8/8/K7 w - - 0 1', 'd4')).toEqual(['c3', 'c5', 'e3', 'e5']);
  });

  it('White Khon moves one step diagonally or straight forward', () => {
    expect(targets('7k/8/8/8/3S4/8/8/K7 w - - 0 1', 'd4')).toEqual(['c3', 'c5', 'd5', 'e3', 'e5']);
  });

  it('Black Khon moves forward toward rank 1', () => {
    expect(targets('7k/8/8/3s4/8/8/8/K7 b - - 0 1', 'd5')).toEqual(['c4', 'c6', 'd4', 'e4', 'e6']);
  });

  it('Ma jumps like a knight', () => {
    expect(targets('7k/8/8/8/3N4/8/8/K7 w - - 0 1', 'd4')).toEqual(['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5']);
  });

  it('Ruea slides along ranks and files', () => {
    expect(targets('7k/8/8/8/3R4/8/8/K7 w - - 0 1', 'd4')).toHaveLength(14);
  });

  it('Ruea stops at blockers and captures enemies', () => {
    expect(targets('7k/8/8/3p4/1N1R4/8/8/K7 w - - 0 1', 'd4')).toEqual([
      'c4', 'd1', 'd2', 'd3', 'd5', 'e4', 'f4', 'g4', 'h4',
    ]);
  });

  it('Bia moves one step forward (no double step) and captures diagonally', () => {
    expect(targets('7k/8/8/8/3p1p2/4P3/8/K7 w - - 0 1', 'e3')).toEqual(['d4', 'e4', 'f4']);
  });

  it('Bia cannot capture straight ahead', () => {
    expect(targets('7k/8/8/8/3pnp2/4P3/8/K7 w - - 0 1', 'e3')).toEqual(['d4', 'f4']);
  });

  it('Black Bia moves toward rank 1', () => {
    expect(targets('7k/8/8/4p3/8/8/8/K7 b - - 0 1', 'e5')).toEqual(['e4']);
  });
});

describe('legality', () => {
  it('has the 23 reference moves in the start position', () => {
    expect(allUci('rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1')).toEqual(
      'a3a4 b3b4 c3c4 d3d4 e3e4 f3f4 g3g4 h3h4 b1d2 g1e2 a1a2 h1h2 e1d2 e1f2 c1b2 c1c2 c1d2 f1e2 f1f2 f1g2 d1c2 d1d2 d1e2'
        .split(' ')
        .sort(),
    );
  });

  it('a pinned piece cannot move', () => {
    expect(targets('k3r3/8/8/8/8/8/4N3/4K3 w - - 0 1', 'e2')).toEqual([]);
  });

  it('the Khun cannot step into check', () => {
    expect(targets('k2r4/8/8/8/8/8/8/4K3 w - - 0 1', 'e1')).toEqual(['e2', 'f1', 'f2']);
  });

  it('only check-escaping moves are legal when in check', () => {
    expect(allUci('4r2k/8/8/8/8/8/R7/4K3 w - - 0 1')).toEqual(['a2e2', 'e1d1', 'e1d2', 'e1f1', 'e1f2']);
  });

  it('Khuns may not stand next to each other', () => {
    expect(targets('8/8/3k4/8/3K4/8/8/8 w - - 0 1', 'd4')).toEqual(['c3', 'c4', 'd3', 'e3', 'e4']);
  });

  it('a Khon attacks the square in front of it', () => {
    expect(targets('8/8/8/8/4s3/8/4K3/7k w - - 0 1', 'e2')).not.toContain('e3');
  });
});
