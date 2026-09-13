import { Game, moveToUci, START_FEN } from '@makruk/engine';
import * as core from '@makruk/engine/core';
import { describe, expect, it } from 'vitest';
import { bestMove, BOTS, chooseMove, inConversion, MATE, mulberry32, positionKey, search } from './index';

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

  it('without exact root scores finds the same best move with fewer nodes', () => {
    const fen = '6kr/5s2/1r1p1m1p/2nPpM~2/1pP1PpP1/1P3P1R/1S2SM2/2N3K1 w - - 10 40';
    const exact = search(core.parseFen(fen), { maxDepth: 3 });
    const narrow = search(core.parseFen(fen), { maxDepth: 3, exactRootScores: false });
    expect(narrow.move).toBe(exact.move);
    expect(narrow.score).toBe(exact.score);
    expect(narrow.nodes).toBeLessThan(exact.nodes);
  });

  it('avoids moves that repeat an earlier position when others are available', () => {
    // Every move except the safe Ruea shift h1g1 would recreate an earlier position.
    const fen = 'k7/8/8/8/8/8/8/K6R w - - 0 1';
    const game = new Game(fen);
    const moves = game.legalMoves();
    const keep = moves.find((m) => moveToUci(m) === 'h1g1')!;
    const history = moves
      .filter((m) => m !== keep)
      .map((m) => {
        const g = new Game(fen);
        g.move(m);
        return positionKey(g.fen());
      });
    const result = search(core.parseFen(fen), { maxDepth: 2, history, contempt: 200 });
    expect(moveToUci({ from: core.moveFrom(result.move), to: core.moveTo(result.move), promotion: false })).toBe('h1g1');
    expect(result.rootMoves.filter((r) => r.score === -200)).toHaveLength(moves.length - 1);
  });

  it("avoids moves that let the opponent's reply repeat an earlier position", () => {
    // After h1h2, the lone Khun can step a8b8 into a position seen before; the losing side takes that draw.
    const fen = 'k7/8/8/8/8/8/8/K6R w - - 0 1';
    const g = new Game(fen);
    g.move('h1h2');
    g.move('a8b8');
    const history = [positionKey(fen), positionKey(g.fen())];
    const result = search(core.parseFen(fen), { maxDepth: 2, history, contempt: 200 });
    const scoreOf = (uci: string) =>
      result.rootMoves.find((r) => moveToUci({ from: core.moveFrom(r.move), to: core.moveTo(r.move), promotion: false }) === uci)!.score;
    expect(scoreOf('h1h2')).toBe(-200);
    expect(scoreOf('h1g1')).toBeGreaterThan(0);
    expect(moveToUci({ from: core.moveFrom(result.move), to: core.moveTo(result.move), promotion: false })).not.toBe('h1h2');
  });

  it('still repeats when every other move loses', () => {
    // Only legal moves: the Khun can step back and forth; repeating is fine when nothing else exists.
    const fen = '7k/8/8/8/8/8/r7/K7 w - - 0 1';
    const legal = new Game(fen).legalMoves().map(moveToUci);
    const history = legal.map((uci) => {
      const g = new Game(fen);
      g.move(uci);
      return positionKey(g.fen());
    });
    expect(bestMove(fen, { maxDepth: 2, history })).not.toBeNull();
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

  it('switches to conversion mode only when clearly winning', () => {
    expect(inConversion(START_FEN)).toBe(false);
    expect(inConversion('4k3/8/8/8/8/8/8/R3K3 w - - 0 1')).toBe(true);
    expect(inConversion('4k3/8/8/8/8/8/8/R3K3 b - - 0 1')).toBe(false);
    // A running count helps only the side that is ahead.
    expect(inConversion('4k3/8/8/8/8/8/8/MS2K3 w - 88 10 40')).toBe(true);
    expect(inConversion('4k3/8/8/8/8/8/8/MS2K3 b - 88 10 40')).toBe(false);
  });

  it('a weak bot never blunders randomly while converting a won endgame', () => {
    const blunderAlways = () => 0;
    const move = chooseMove('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 1, { rng: blunderAlways, ignoreTime: true });
    expect(move!.depth).toBeGreaterThanOrEqual(3);
    const normal = chooseMove(START_FEN, 1, { rng: blunderAlways, ignoreTime: true });
    expect(normal!.depth).toBe(0);
  });

  it('level 2 mates a lone Khun with Ruea and Met within the counting limit', () => {
    const game = new Game('8/8/3k4/8/8/8/8/R2MK3 w - - 0 1');
    const rng = mulberry32(3);
    const history = [positionKey(game.fen())];
    while (!game.isGameOver() && game.moves().length < 120) {
      const move =
        game.turn === 'w'
          ? chooseMove(game.fen(), 2, { rng, ignoreTime: true, history })
          : bestMove(game.fen(), { maxDepth: 2, history });
      history.push(positionKey(game.move(move!.uci).fenAfter));
    }
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('is reproducible with the same seed', () => {
    const a = chooseMove(START_FEN, 2, { rng: mulberry32(7), ignoreTime: true });
    const b = chooseMove(START_FEN, 2, { rng: mulberry32(7), ignoreTime: true });
    expect(a).toEqual(b);
  });
});
