import { describe, expect, it } from 'vitest';
import { createClock, flaggedSide, formatClock, pressClock, runFor, stopClock, timesAt } from './clock';
import { PRESETS, toTimeControl } from './timeControls';

describe('clock', () => {
  it('counts down only the running side', () => {
    const clock = createClock(60_000, 1_000);
    expect(timesAt(clock, 4_000)).toEqual({ w: 57_000, b: 60_000 });
  });

  it('pressing the clock charges time, adds increment and starts the opponent', () => {
    let clock = createClock(120_000, 0);
    clock = pressClock(clock, 'w', 3_000, 1_000);
    expect(clock.remaining).toEqual({ w: 118_000, b: 120_000 });
    expect(clock.running).toBe('b');
    expect(timesAt(clock, 5_000)).toEqual({ w: 118_000, b: 118_000 });
  });

  it('ignores a press by the side that is not running', () => {
    const clock = createClock(60_000, 0);
    expect(pressClock(clock, 'b', 1_000, 0)).toBe(clock);
  });

  it('flags when the running side reaches zero', () => {
    const clock = createClock(1_000, 0);
    expect(flaggedSide(clock, 999)).toBeNull();
    expect(flaggedSide(clock, 1_000)).toBe('w');
    expect(timesAt(clock, 5_000).w).toBe(0);
  });

  it('can be stopped and re-pointed at a side', () => {
    const stopped = stopClock(createClock(10_000, 0), 2_000);
    expect(stopped.running).toBeNull();
    expect(timesAt(stopped, 9_000)).toEqual({ w: 8_000, b: 10_000 });
    expect(timesAt(runFor(stopped, 'b', 9_000), 10_000)).toEqual({ w: 8_000, b: 9_000 });
  });

  it('formats minutes and tenths', () => {
    expect(formatClock(600_000)).toBe('10:00');
    expect(formatClock(61_500)).toBe('1:02');
    expect(formatClock(10_000)).toBe('0:10');
    expect(formatClock(9_450)).toBe('9.4');
    expect(formatClock(-5)).toBe('0.0');
  });
});

describe('time controls', () => {
  it('has the common presets', () => {
    expect(PRESETS.map((p) => p.id)).toEqual(['1+0', '2+1', '3+0', '3+2', '5+0', '5+3', '10+0', '10+5', '15+10', '30+0', '30+20']);
  });

  it('converts choices to milliseconds', () => {
    expect(toTimeControl({ kind: 'none' })).toBeNull();
    expect(toTimeControl({ kind: 'preset', id: '3+2' })).toEqual({ initialMs: 180_000, incrementMs: 2_000 });
    expect(toTimeControl({ kind: 'custom', minutes: 7, increment: 4 })).toEqual({ initialMs: 420_000, incrementMs: 4_000 });
    expect(toTimeControl({ kind: 'custom', minutes: 0, increment: 999 })).toEqual({ initialMs: 60_000, incrementMs: 60_000 });
  });
});
