/**
 * Chess clock arithmetic. Pure: callers pass `now` (ms), so the same code runs in the browser
 * (local games) and on the server (authoritative online clocks).
 */
import type { Color } from './types';

/** `since` is the timestamp at which the running side's clock started. */
export interface ClockState {
  remaining: Record<Color, number>;
  running: Color | null;
  since: number | null;
}

const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');

export function createClock(initialMs: number, now: number, running: Color | null = 'w'): ClockState {
  return { remaining: { w: initialMs, b: initialMs }, running, since: running ? now : null };
}

/** Remaining time for both sides at `now`. */
export function timesAt(clock: ClockState, now: number): Record<Color, number> {
  if (!clock.running || clock.since === null) return clock.remaining;
  const spent = Math.max(0, now - clock.since);
  return { ...clock.remaining, [clock.running]: Math.max(0, clock.remaining[clock.running] - spent) };
}

/** The mover finishes their turn: charge elapsed time, add increment, start the opponent. */
export function pressClock(clock: ClockState, mover: Color, now: number, incrementMs: number): ClockState {
  if (clock.running !== mover) return clock;
  const times = timesAt(clock, now);
  return { remaining: { ...times, [mover]: times[mover] + incrementMs }, running: other(mover), since: now };
}

export function runFor(clock: ClockState, color: Color, now: number): ClockState {
  return { remaining: timesAt(clock, now), running: color, since: now };
}

export function stopClock(clock: ClockState, now: number): ClockState {
  return { remaining: timesAt(clock, now), running: null, since: null };
}

export function flaggedSide(clock: ClockState, now: number): Color | null {
  if (!clock.running) return null;
  return timesAt(clock, now)[clock.running] <= 0 ? clock.running : null;
}

/** Timestamp at which the running side will flag, or null if no clock is running. */
export function flagTime(clock: ClockState): number | null {
  if (!clock.running || clock.since === null) return null;
  return clock.since + clock.remaining[clock.running];
}
