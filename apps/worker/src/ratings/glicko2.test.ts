import { describe, expect, it } from 'vitest';
import { DEFAULT_RATING, rateGame, timeClassOf, updateRating } from './glicko2';

describe('Glicko-2 (acct-003)', () => {
  it("matches the worked example in Glickman's Glicko-2 paper", () => {
    const player = { rating: 1500, rd: 200, vol: 0.06 };
    const updated = updateRating(player, [
      { opponent: { rating: 1400, rd: 30, vol: 0.06 }, score: 1 },
      { opponent: { rating: 1550, rd: 100, vol: 0.06 }, score: 0 },
      { opponent: { rating: 1700, rd: 300, vol: 0.06 }, score: 0 },
    ]);
    expect(updated.rating).toBeCloseTo(1464.06, 1);
    expect(updated.rd).toBeCloseTo(151.52, 1);
    expect(updated.vol).toBeCloseTo(0.05999, 4);
  });

  it('a win between two new players moves ratings symmetrically', () => {
    const { white, black } = rateGame(DEFAULT_RATING, DEFAULT_RATING, 'w');
    expect(white.rating).toBeGreaterThan(1500);
    expect(black.rating).toBeLessThan(1500);
    expect(white.rating - 1500).toBeCloseTo(1500 - black.rating, 6);
    expect(white.rd).toBeLessThan(350);
  });

  it('a draw between equals leaves ratings unchanged but lowers deviation', () => {
    const { white, black } = rateGame(DEFAULT_RATING, DEFAULT_RATING, null);
    expect(white.rating).toBeCloseTo(1500, 6);
    expect(black.rating).toBeCloseTo(1500, 6);
    expect(white.rd).toBeLessThan(350);
  });

  it('beating a much stronger player gains more than beating a weaker one', () => {
    const me = { rating: 1500, rd: 80, vol: 0.06 };
    const upset = updateRating(me, [{ opponent: { rating: 1900, rd: 80, vol: 0.06 }, score: 1 }]);
    const expected = updateRating(me, [{ opponent: { rating: 1100, rd: 80, vol: 0.06 }, score: 1 }]);
    expect(upset.rating - 1500).toBeGreaterThan(expected.rating - 1500);
  });

  it('classifies time controls by estimated duration', () => {
    const tc = (minutes: number, increment: number) => ({ initialMs: minutes * 60_000, incrementMs: increment * 1000 });
    expect(timeClassOf(tc(1, 0))).toBe('bullet');
    expect(timeClassOf(tc(2, 1))).toBe('bullet');
    expect(timeClassOf(tc(3, 2))).toBe('blitz');
    expect(timeClassOf(tc(5, 0))).toBe('blitz');
    expect(timeClassOf(tc(10, 0))).toBe('rapid');
    expect(timeClassOf(tc(15, 10))).toBe('rapid');
    expect(timeClassOf(tc(30, 0))).toBe('classical');
  });
});
