import { Game, START_FEN } from '@makruk/engine';
import { describe, expect, it } from 'vitest';
import { bestMove, BOTS, chooseMove, MATE, mulberry32 } from './index';

describe('search', () => {
  it('finds mate in one', () => {
    const move = bestMove('k7/2R5/8/8/8/8/8/4K2R w - - 0 1', { maxDepth: 2 });
    expect(move?.uci).toBe('h1h8');
    expect(move!.score).toBeGreaterThan(MATE - 10);
  });

  it('captures a hanging Ruea', () => {
    expect(bestMove('4k3/8/8/3r4/8/2N5/8/4K3 w - - 0 1', { maxDepth: 3 })?.uci).toBe('c3d5');
  });

  it('does not grab a defended Bia with its Ruea', () => {
    // d6 Bia is defended by the c7... Black Bia on c7? use Khon: Black Khon on e7 defends d6.
    const move = bestMove('4k3/4s3/3p4/8/8/8/8/3RK3 w - - 0 1', { maxDepth: 3 });
    expect(move?.uci).not.toBe('d1d6');
  });

  it('escapes check when in check', () => {
    const fen = '4r2k/8/8/8/8/8/R7/4K3 w - - 0 1';
    const move = bestMove(fen, { maxDepth: 3 });
    const legal = new Game(fen).legalMoves().length;
    expect(legal).toBe(5);
    expect(() => new Game(fen).move(move!.uci)).not.toThrow();
  });

  it('returns null when there is no legal move', () => {
    expect(bestMove('7k/R7/8/8/8/8/8/4K1R1 b - - 0 1')).toBeNull();
  });
});

describe('bots', () => {
  it('has six levels with increasing budgets', () => {
    expect(BOTS.map((b) => b.key)).toEqual(['bia', 'met', 'khon', 'ma', 'ruea', 'khun']);
    for (let i = 1; i < BOTS.length; i++) expect(BOTS[i]!.maxNodes).toBeGreaterThan(BOTS[i - 1]!.maxNodes);
  });

  it.each(BOTS.map((b) => [b.key, b.id] as const))('%s always plays a legal move', (_key, id) => {
    const game = new Game(START_FEN);
    const rng = mulberry32(id);
    for (let ply = 0; ply < 6 && !game.isGameOver(); ply++) {
      const move = chooseMove(game.fen(), Math.min(id, 4), { rng, ignoreTime: true });
      expect(move).not.toBeNull();
      game.move(move!.uci);
    }
  });

  it('is reproducible with the same seed', () => {
    const a = chooseMove(START_FEN, 2, { rng: mulberry32(7), ignoreTime: true });
    const b = chooseMove(START_FEN, 2, { rng: mulberry32(7), ignoreTime: true });
    expect(a).toEqual(b);
  });
});
