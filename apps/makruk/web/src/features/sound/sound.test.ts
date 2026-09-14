import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from '../../stores/settings';
import { playSound } from './sound';

describe('sound effects', () => {
  beforeEach(() => {
    window.__makrukSoundLog = [];
    useSettings.getState().update({ sound: true, haptics: false });
  });

  it('respects the mute setting', () => {
    playSound('move');
    expect(window.__makrukSoundLog).toEqual(['move']);
    useSettings.getState().update({ sound: false });
    playSound('capture');
    expect(window.__makrukSoundLog).toEqual(['move']);
  });
});
