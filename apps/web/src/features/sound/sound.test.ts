import { Game } from '@makruk/engine';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '../../stores/settings';
import { playSound, soundForMove } from './sound';

describe('sound effects', () => {
  beforeEach(() => {
    window.__makrukSoundLog = [];
    useSettings.getState().update({ sound: true, haptics: false });
  });

  it('chooses move, capture, check and game-end sounds from the move', () => {
    const game = new Game('4k3/8/8/3p4/8/8/8/R2MK3 w - - 0 1');
    const quiet = game.move('a1a2');
    expect(soundForMove(quiet, game.status())).toBe('move');

    const check = new Game('4k3/8/8/8/8/8/8/R3K3 w - - 0 1');
    expect(soundForMove(check.move('a1a8'), check.status())).toBe('check');

    // The extra White Ruea keeps mating material after the capture (K+Ma vs K alone would end the game).
    const capture = new Game('4k3/8/8/3r4/8/2N5/8/4K2R w - - 0 1');
    expect(soundForMove(capture.move('c3d5'), capture.status())).toBe('capture');

    const mate = new Game('k7/2R5/8/8/8/8/8/4K2R w - - 0 1');
    expect(soundForMove(mate.move('h1h8'), mate.status())).toBe('gameEnd');
  });

  it('respects the mute setting', () => {
    playSound('move');
    expect(window.__makrukSoundLog).toEqual(['move']);
    useSettings.getState().update({ sound: false });
    playSound('capture');
    expect(window.__makrukSoundLog).toEqual(['move']);
  });
});
