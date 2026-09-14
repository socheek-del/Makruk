import { describe, expect, it } from 'vitest';
import { Game } from './game';

/** Counting limit, counted plies (or halfmove clock) and fullmove fields of a FEN. */
const tail = (game: Game) => game.fen().split(' ').slice(3).join(' ');

// Every expectation below was probed with Fairy-Stockfish's sittuyin variant (ffish 0.7.10).
describe('game end (sit-003)', () => {
  it('checkmate wins', () => {
    const game = new Game('k7/2K5/8/8/8/8/8/7R[] w - - 0 1');
    expect(game.move('h1a1').san).toBe('Ra1#');
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('stalemate is a draw', () => {
    expect(new Game('k7/2K5/1F6/8/8/8/8/7R[] b - - 0 1').status()).toEqual({ kind: 'stalemate' });
  });

  it('threefold repetition is a draw', () => {
    const game = new Game('r3k2n/p7/8/8/8/8/P7/R3K2N[] w - - 0 1');
    for (const uci of ['h1g3', 'h8g6', 'g3h1', 'g6h8', 'h1g3', 'h8g6', 'g3h1']) {
      game.move(uci);
      expect(game.isGameOver()).toBe(false);
    }
    game.move('g6h8');
    expect(game.fen()).toBe('r3k2n/p7/8/8/8/8/P7/R3K2N[] w - - 8 5');
    expect(game.status()).toEqual({ kind: 'repetition' });
    game.undo();
    expect(game.isGameOver()).toBe(false);
  });

  it('50 moves without a capture, Ne move or placement is a draw', () => {
    const game = new Game('r3k3/p7/8/8/8/8/P7/R3K2N[] w - - 99 60');
    expect(game.isGameOver()).toBe(false);
    game.move('h1g3');
    expect(game.status()).toEqual({ kind: 'fifty-move' });
  });

  it.each([
    ['K vs K', 'k7/8/8/8/8/8/8/K7[] w - - 0 1'],
    ['K+F vs K', 'k7/8/8/8/8/8/8/K1F5[] w - - 0 1'],
    ['K+N vs K', 'k7/8/8/8/8/8/8/K1N5[] w - - 0 1'],
    ['K+P vs K', 'k7/2K5/8/8/8/8/P7/8[] w - - 0 1'],
  ])('%s is insufficient material', (_label, fen) => {
    expect(new Game(fen).status()).toEqual({ kind: 'insufficient-material' });
  });

  it('a Sin can mate, and a piece still in hand can be placed', () => {
    expect(new Game('k7/8/8/8/8/8/8/K1S5[] w - - 0 1').isGameOver()).toBe(false);
    expect(new Game('k7/8/8/8/8/8/8/K7[R] w - - 0 1').isGameOver()).toBe(false);
  });
});

describe('counting (sit-003)', () => {
  it.each([
    ['Yahhta', '4k3/8/8/8/8/8/8/R3K3[] w - - 0 1', 'a1a2', '32 0 1'],
    ['two Yahhta', '4k3/8/8/8/8/8/R7/R3K3[] w - - 0 1', 'a1b1', '32 0 1'],
    ['Yahhta and Sin', '4k3/8/8/8/8/8/S7/R3K3[] w - - 0 1', 'a2b3', '32 0 1'],
    ['Yahhta and Myin', '4k3/8/8/8/8/8/N7/R3K3[] w - - 0 1', 'a2b4', '32 0 1'],
    ['Sit-ke and Yahhta', '4k3/8/8/8/8/8/R7/F3K3[] w - - 0 1', 'a2b2', '32 0 1'],
    ['Sin', '4k3/8/8/8/8/8/8/S3K3[] w - - 0 1', 'a1b2', '88 0 1'],
    ['two Sin', '4k3/8/8/8/8/8/S7/S3K3[] w - - 0 1', 'a1b2', '88 0 1'],
    ['Sin and Myin', '4k3/8/8/8/8/8/S7/N3K3[] w - - 0 1', 'a2b3', '88 0 1'],
    ['Sit-ke and Sin', '4k3/8/8/8/8/8/S7/F3K3[] w - - 0 1', 'a2b3', '88 0 1'],
    ['two Myin', '4k3/8/8/8/8/8/N7/N3K3[] w - - 0 1', 'a1b3', '128 0 1'],
    ['Sit-ke and Myin', '4k3/8/8/8/8/8/N7/F3K3[] w - - 0 1', 'a1b2', '128 0 1'],
    ['promoted Sit-ke and Myin', '4k3/8/8/8/8/8/N7/F~3K3[] w - - 0 1', 'a2b4', '128 0 1'],
    ['Sit-ke alone: no count', '4k3/8/8/8/8/8/8/F3K3[] w - - 0 1', 'a1b2', '- 1 1'],
    ['defender still has a piece: no count', '4k3/7n/8/8/8/8/S7/R3K3[] w - - 0 1', 'a1b1', '- 1 1'],
    ['capturing the last Ne starts the count', '4k3/8/8/8/8/8/p7/R3K3[] w - - 0 1', 'a1a2', '32 0 1'],
  ])('lone Min-gyi against %s', (_label, fen, uci, expected) => {
    const game = new Game(fen);
    game.move(uci);
    expect(tail(game)).toBe(expected);
  });

  it('counts every ply and draws once the count passes its limit', () => {
    const game = new Game('4k3/8/8/8/8/8/8/R3K3[] w - - 0 1');
    game.move('a1a2');
    game.move('e8d8');
    expect(tail(game)).toBe('32 1 2');
    expect(game.counting()).toEqual({ limitPlies: 32, plies: 1 });

    const atLimit = new Game('4k3/8/8/8/8/8/8/R3K3[] b - 32 32 1');
    expect(atLimit.isGameOver()).toBe(false);
    atLimit.move('e8d8');
    expect(atLimit.status()).toEqual({ kind: 'counting' });
  });

  it("a lone Min-gyi's capture keeps the running count", () => {
    const game = new Game('k7/1R6/8/8/8/8/8/N3K3[] b - 32 5 10');
    game.move('a8b7');
    expect(tail(game)).toBe('32 6 11');
  });

  it('a capture that leaves a lone Min-gyi restarts the count with the new limit', () => {
    const game = new Game('k7/8/8/8/8/8/n7/R3K3[] w - 128 40 30');
    game.move('a1a2');
    expect(tail(game)).toBe('32 0 30');
  });

  it('when the lone side captures the last Ne, the count starts after the next move', () => {
    const game = new Game('k7/P7/8/8/8/8/8/4K2R[] b - - 7 30');
    game.move('a8a7');
    expect(tail(game)).toBe('- 0 31');
    game.move('h1h2');
    expect(tail(game)).toBe('32 0 31');
  });

  it('a capture that leaves only bare Min-gyi keeps the running count', () => {
    const game = new Game('8/8/8/8/8/1k6/1R6/7K[] b - 32 22 51');
    game.move('b3b2');
    expect(tail(game)).toBe('32 23 52');
  });

  it('the counted plies are not the 50-move clock', () => {
    const game = new Game('1k6/8/8/8/8/8/8/R3K3[] w - 128 99 30');
    game.move('a1a2');
    expect(tail(game)).toBe('128 100 30');
    expect(game.isGameOver()).toBe(false);
  });
});
