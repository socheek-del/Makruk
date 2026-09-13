import { describe, expect, it } from 'vitest';
import { parseSquare } from './board';
import { Game, IllegalMoveError } from './game';

const play = (fen: string, ...moves: string[]) => {
  const game = new Game(fen);
  for (const m of moves) game.move(m);
  return game;
};

describe('check, checkmate, stalemate, repetition (engine-003)', () => {
  it('detects checkmate', () => {
    const game = new Game('R6k/1R6/8/8/8/8/8/4K3 b - - 0 1');
    expect(game.inCheck()).toBe(true);
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('marks a mating move with # and a checking move with +', () => {
    const game = new Game('k7/2R5/8/8/8/8/8/4K2R w - - 0 1');
    const mate = game.move('h1h8');
    expect(mate.san).toBe('Rh8#');
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
    expect(new Game('4k3/8/8/8/8/8/8/R3K3 w - - 0 1').move('a1a8').san).toBe('Ra8+');
  });

  it('detects stalemate as a draw', () => {
    const game = new Game('7k/R7/8/8/8/8/8/4K1R1 b - - 0 1');
    expect(game.inCheck()).toBe(false);
    expect(game.status()).toEqual({ kind: 'stalemate' });
  });

  it('detects threefold repetition', () => {
    const game = new Game();
    const cycle = ['b1d2', 'g8e7', 'd2b1', 'e7g8'];
    for (const m of cycle) game.move(m);
    expect(game.status()).toEqual({ kind: 'ongoing' });
    for (const m of cycle) game.move(m);
    expect(game.fen()).toBe('rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 8 5');
    expect(game.status()).toEqual({ kind: 'repetition' });
  });

  it.each([
    ['bare Khuns', '4k3/8/8/8/8/8/8/4K3 w - - 0 1'],
    ['Ma against a lone Khun', '4k3/8/8/8/8/8/8/1N2K3 w - - 0 1'],
    ['Met against a lone Khun', '4k3/8/8/8/8/8/8/M3K3 w - - 0 1'],
    ['Bia against a lone Khun', '4k3/8/8/8/8/P7/8/4K3 w - - 0 1'],
    ['two Mets on the same colour', '4k3/8/8/8/8/8/1M6/M3K3 w - - 0 1'],
  ])('declares a draw by insufficient material: %s', (_label, fen) => {
    expect(new Game(fen).status()).toEqual({ kind: 'insufficient-material' });
  });

  it.each([
    ['a Ruea', '4k3/8/8/8/8/8/8/R3K3 w - - 0 1'],
    ['a Khon', '4k3/8/8/8/8/8/8/S3K3 w - - 0 1'],
    ['Mets on both colours', '4k3/8/8/8/8/8/M7/M3K3 w - - 0 1'],
    ['Ma with a helper piece', '4k3/8/8/8/8/8/8/NN2K3 w - - 0 1'],
  ])('keeps playing with mating material: %s', (_label, fen) => {
    expect(new Game(fen).status()).toEqual({ kind: 'ongoing' });
  });

  it('rejects illegal moves with a typed error', () => {
    const game = new Game();
    expect(() => game.move('e3e5')).toThrow(IllegalMoveError);
    expect(() => game.move('zz')).toThrow(IllegalMoveError);
  });

  it('undo restores the previous position exactly', () => {
    const game = new Game();
    const before = game.fen();
    game.move('e3e4');
    game.move('d6d5');
    game.move('e4d5');
    expect(game.undo()?.san).toBe('exd5');
    game.undo();
    game.undo();
    expect(game.fen()).toBe(before);
    expect(game.undo()).toBeNull();
  });
});

describe('promotion (engine-004)', () => {
  it('White Bia promotes on rank 6 by moving forward', () => {
    const game = new Game('4k3/8/8/P7/8/8/8/4K3 w - - 0 1');
    const record = game.move('a5a6');
    expect(record.promotion).toBe(true);
    expect(record.san).toBe('a6=M');
    expect(game.pieceAt(parseSquare('a6'))).toEqual({ color: 'w', type: 'm', promoted: true });
  });

  it('White Bia promotes by capturing onto rank 6', () => {
    const game = new Game('4k3/8/n7/1P6/8/8/8/4K3 w - - 0 1');
    const record = game.move('b5a6m');
    expect(record.promotion).toBe(true);
    expect(record.captured).toEqual({ color: 'b', type: 'n', promoted: false });
    expect(game.pieceAt(parseSquare('a6'))?.type).toBe('m');
  });

  it('Black Bia promotes on rank 3', () => {
    const game = new Game('4k3/8/8/8/p7/8/8/4K3 b - - 0 1');
    game.move('a4a3');
    expect(game.pieceAt(parseSquare('a3'))).toEqual({ color: 'b', type: 'm', promoted: true });
  });

  it('Black Bia promotes by capture', () => {
    const game = new Game('4k3/8/8/8/1p6/R7/8/4K3 b - - 0 1');
    game.move('b4a3');
    expect(game.pieceAt(parseSquare('a3'))).toEqual({ color: 'b', type: 'm', promoted: true });
  });

  it('a promoted Bia moves like a Met', () => {
    const game = play('4k3/8/8/2P5/8/8/8/4K3 w - - 0 1', 'c5c6', 'e8f8');
    expect(game.legalMovesFrom(parseSquare('c6')).map((m) => m.to).sort()).toEqual(
      ['b5', 'b7', 'd5', 'd7'].map(parseSquare).sort(),
    );
  });

  it('undo turns the Met back into a Bia', () => {
    const game = new Game('4k3/8/8/P7/8/8/8/4K3 w - - 0 1');
    game.move('a5a6');
    game.undo();
    expect(game.pieceAt(parseSquare('a5'))).toEqual({ color: 'w', type: 'p', promoted: false });
  });
});

describe('counting rules (engine-005)', () => {
  it('starts pieces-honour counting for a lone Khun against a Ruea (16 moves)', () => {
    const game = play('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'a1a2');
    expect(game.fen()).toBe('4k3/8/8/8/8/8/R7/4K3 b - 32 6 1');
    game.move('e8d8');
    expect(game.fen()).toBe('3k4/8/8/8/8/8/R7/4K3 w - 32 7 2');
    expect(game.counting()).toEqual({ kind: 'pieces', side: 'b', limitPlies: 32, plies: 7 });
  });

  it("starts board's-honour counting once no Bia remain (64 moves)", () => {
    const game = play('4k3/3m4/8/8/8/8/8/RN2K3 w - - 0 1', 'b1c3');
    expect(game.fen()).toBe('4k3/3m4/8/8/8/2N5/8/R3K3 b - 128 0 1');
    expect(game.counting()).toEqual({ kind: 'board', side: 'b', limitPlies: 128, plies: 0 });
  });

  it('promoting the last Bia starts counting', () => {
    expect(play('4k3/8/8/P7/8/8/8/4K3 w - - 0 1', 'a5a6').fen()).toBe('4k3/8/M~7/8/8/8/8/4K3 b - 128 6 1');
  });

  it.each([
    ['two Ruea → 8 moves', '4k3/8/8/8/8/8/8/RR2K3 w - - 0 1', 'b1b2', 16],
    ['one Ruea → 16 moves', '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'a1a2', 32],
    ['Ruea outranks Khons', '4k3/8/8/8/8/8/8/RSS1K3 w - - 0 1', 'c1c2', 32],
    ['two Khon → 22 moves', '4k3/8/8/8/8/8/8/SS2K3 w - - 0 1', 'b1b2', 44],
    ['two Ma → 32 moves', '4k3/8/8/8/8/8/8/NN2K3 w - - 0 1', 'b1d2', 64],
    ['one Khon → 44 moves', '4k3/8/8/8/8/8/8/S3K3 w - - 0 1', 'a1a2', 88],
    ['Met only → 64 moves', '4k3/8/8/8/8/8/8/M3K3 w - - 0 1', 'a1b2', 128],
  ])("pieces' honour limit: %s", (_label, fen, move, limit) => {
    const game = play(fen, move);
    const pieces = game.pieces().length;
    expect(game.counting()).toEqual({ kind: 'pieces', side: 'b', limitPlies: limit, plies: 2 * pieces });
  });

  it('no counting while any Bia remain', () => {
    expect(play('rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1', 'e3e4').counting()).toBeNull();
  });

  it('declares a draw when the count passes the limit', () => {
    const game = new Game('4k3/8/8/8/8/8/8/R3K3 b - 32 32 50');
    expect(game.status()).toEqual({ kind: 'ongoing' });
    game.move('e8d8');
    expect(game.fen()).toBe('3k4/8/8/8/8/8/8/R3K3 w - 32 33 51');
    expect(game.status()).toEqual({ kind: 'counting' });
  });

  it('checkmate on the move that passes the limit still wins', () => {
    const game = new Game('k7/2R5/8/8/8/8/8/4K2R w - 32 32 50');
    game.move('h1h8');
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('a lone Khun capturing the last Bia starts its count', () => {
    const game = play('8/8/8/8/1k6/1P6/8/R3K3 b - - 0 1', 'b4b3');
    expect(game.fen()).toBe('8/8/8/8/8/1k6/8/R3K3 w - 32 5 2');
  });
});
