import { describe, expect, it } from 'vitest';
import { START_FEN } from './index';

describe('START_FEN', () => {
  it('describes 8 ranks with White to move', () => {
    const [placement, turn] = START_FEN.split(' ');
    expect(placement?.split('/')).toHaveLength(8);
    expect(turn).toBe('w');
  });
});
