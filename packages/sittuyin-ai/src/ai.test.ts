import { MATE, search } from '@chaturanga/ai-core';
import { Game, parseSquare, START_FEN } from '@chaturanga/sittuyin';
import { parseFen } from '@chaturanga/sittuyin/core';
import { describe, expect, it } from 'vitest';
import {
  bestMove,
  BOTS,
  chooseMove,
  inConversion,
  mulberry32,
  positionKey,
  SittuyinSearch,
} from './index';

describe('search (sit-004)', () => {
  it('finds mate in one', () => {
    const move = bestMove('k7/2K5/8/8/8/8/8/7R[] w - - 0 1', { maxDepth: 2 });
    expect(move?.uci).toBe('h1a1');
    expect(move!.score).toBeGreaterThan(MATE - 10);
  });

  it('captures a hanging Yahhta', () => {
    expect(bestMove('4k3/8/8/3r4/8/2N5/8/4K3[] w - - 0 1', { maxDepth: 3 })?.uci).toBe('c3d5');
  });

  it('escapes check with a legal move', () => {
    const fen = '4r2k/8/8/8/8/8/R7/4K3[] w - - 0 1';
    const move = bestMove(fen, { maxDepth: 3 });
    expect(new Game(fen).legalUci()).toContain(move!.uci);
  });

  it('values promoting a Ne above a quiet push', () => {
    // At depth 1 the promotion is scored now; deeper searches may push first and promote in quiescence.
    const move = bestMove('4k3/8/8/3P4/8/8/8/4K3[] w - - 0 1', { maxDepth: 1 });
    expect(move?.uci.endsWith('f')).toBe(true);
  });

  it('keeps the position intact while searching drops, promotions and captures', () => {
    const fen = 'kn2rs1r/2ns1f2/4pppp/pppp4/4PPPP/PPPPNS1K/3S3F/3R1N1R[] w - - 0 9';
    const adapter = new SittuyinSearch(parseFen(fen));
    const before = adapter.key();
    search(adapter, { maxDepth: 3 });
    expect(adapter.key()).toBe(before);
    expect(before).toBe(positionKey(fen));
  });

  it('returns null when there is no legal move', () => {
    expect(bestMove('k7/2K5/8/8/8/8/8/R7[] b - - 0 1')).toBeNull();
    expect(chooseMove('k7/2K5/8/8/8/8/8/R7[] b - - 0 1', 3)).toBeNull();
  });
});

describe('setup placement (sit-004)', () => {
  it.each(BOTS.map((b) => [b.key, b.id] as const))('%s places all 16 pieces legally', (_key, id) => {
    const game = new Game(START_FEN);
    const rng = mulberry32(id);
    while (game.inSetup()) {
      const move = chooseMove(game.fen(), id, { rng, ignoreTime: true });
      expect(move!.uci).toMatch(/^[KSFRN]@[a-h][1-8]$/);
      game.move(move!.uci);
    }
    expect(game.moves()).toHaveLength(16);
  });

  it('the strongest bot shelters its Min-gyi behind the Ne with a guard beside it', () => {
    const game = new Game(START_FEN);
    while (game.inSetup()) game.move(chooseMove(game.fen(), 6, { rng: () => 0.5 })!.uci);
    for (const color of ['w', 'b'] as const) {
      const king = game.pieces().find(({ piece }) => piece.type === 'k' && piece.color === color)!;
      const rel = color === 'w' ? king.square >> 3 : 7 - (king.square >> 3);
      expect(rel).toBeLessThanOrEqual(1);
      const guards = game
        .pieces()
        .filter(({ piece }) => piece.color === color && (piece.type === 'f' || piece.type === 's'))
        .filter(({ square }) => Math.abs((square & 7) - (king.square & 7)) <= 1 && Math.abs((square >> 3) - (king.square >> 3)) <= 1);
      expect(guards.length).toBeGreaterThan(0);
    }
    expect(game.pieceAt(parseSquare('a1'))?.type ?? game.pieceAt(parseSquare('h1'))?.type).toBe('r');
  });

  it('bestMove suggests a placement during setup', () => {
    expect(bestMove(START_FEN)?.uci).toMatch(/^[KSFRN]@/);
  });
});

describe('bots (sit-004)', () => {
  it('has six levels named after the pieces with increasing budgets', () => {
    expect(BOTS.map((b) => b.key)).toEqual(['ne', 'sitke', 'sin', 'myin', 'yahhta', 'mingyi']);
    for (let i = 1; i < BOTS.length; i++) expect(BOTS[i]!.maxNodes).toBeGreaterThan(BOTS[i - 1]!.maxNodes);
  });

  it.each([1, 2, 3])('level %i plays legal moves through setup and into the game', { timeout: 30_000 }, (id) => {
    const game = new Game(START_FEN);
    const rng = mulberry32(id);
    const history = [positionKey(game.fen())];
    while (!game.isGameOver() && game.moves().length < 24) {
      const move = chooseMove(game.fen(), id, { rng, ignoreTime: true, history });
      expect(game.legalUci()).toContain(move!.uci);
      history.push(positionKey(game.move(move!.uci).fenAfter));
    }
    expect(game.inSetup()).toBe(false);
  });

  it('switches to conversion mode only when clearly winning', () => {
    expect(inConversion(START_FEN)).toBe(false);
    expect(inConversion('4k3/8/8/8/8/8/8/R3K3[] w - - 0 1')).toBe(true);
    expect(inConversion('4k3/8/8/8/8/8/8/R3K3[] b - - 0 1')).toBe(false);
    expect(inConversion('4k3/8/8/8/8/8/8/FS2K3[] w - 88 10 40')).toBe(true);
  });

  it('level 2 mates a lone Min-gyi with Yahhta and Sit-ke before the count runs out', () => {
    const game = new Game('8/8/3k4/8/8/8/8/R2FK3[] w - - 0 1');
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
    const fen = 'kn2rs1r/2ns1f2/4pppp/pppp4/4PPPP/PPPPNS1K/3S3F/3R1N1R[] w - - 0 9';
    expect(chooseMove(fen, 2, { rng: mulberry32(7), ignoreTime: true })).toEqual(
      chooseMove(fen, 2, { rng: mulberry32(7), ignoreTime: true }),
    );
    expect(chooseMove(START_FEN, 1, { rng: mulberry32(9) })).toEqual(chooseMove(START_FEN, 1, { rng: mulberry32(9) }));
  });
});
