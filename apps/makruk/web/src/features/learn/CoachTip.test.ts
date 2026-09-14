import { Game } from '@chaturanga/makruk';
import { describe, expect, it } from 'vitest';
import { coachTip } from './CoachTip';

describe('coach tips', () => {
  it('suggests an opening move before the player has moved', () => {
    expect(coachTip(new Game(), 'w')).toBe('firstMove');
  });

  it('waits while the opponent is to move', () => {
    const game = new Game();
    game.move('e3e4');
    expect(coachTip(game, 'w')).toBe('waiting');
  });

  it('warns when the Khun is in check', () => {
    const game = new Game('4k3/8/8/8/8/8/3r4/3K4 w - - 0 1');
    game.move('d1c1');
    game.move('d2c2');
    expect(coachTip(game, 'w')).toBe('inCheck');
  });

  it('points out captures and promotions', () => {
    const capture = new Game('7k/8/8/8/3r4/4P3/8/K7 b - - 0 1');
    capture.move('h8g8');
    capture.move('a1b1');
    capture.move('g8h8');
    expect(coachTip(capture, 'w')).toBe('capture');

    // A White Ruea keeps mating material on the board (K+Bia vs K alone is a draw).
    const promote = new Game('7k/8/8/P7/8/8/8/K5R1 b - - 0 1');
    promote.move('h8h7');
    promote.move('a1b1');
    promote.move('h7h8');
    expect(coachTip(promote, 'w')).toBe('promote');
  });

  it('notices when the opponent just captured', () => {
    const game = new Game('7k/8/8/8/2n5/8/1P6/K5R1 w - - 0 1');
    game.move('a1a2');
    game.move('c4b2');
    expect(coachTip(game, 'w')).toBe('lostPiece');
  });

  it('says well done when the game is over', () => {
    const game = new Game('k7/2R5/8/8/8/8/8/4K2R w - - 0 1');
    game.move('h1h8');
    expect(coachTip(game, 'w')).toBe('gameOver');
  });
});
