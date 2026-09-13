import type { Color } from '@makruk/engine';

/** Immutable chess clock. `since` is the timestamp at which the running side's clock started. */
export interface ClockState {
  remaining: Record<Color, number>;
  running: Color | null;
  since: number | null;
}

const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');

export function createClock(initialMs: number, now: number, running: Color = 'w'): ClockState {
  return { remaining: { w: initialMs, b: initialMs }, running, since: now };
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

/** m:ss, or s.t under ten seconds. */
export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped < 10_000) return `${Math.floor(clamped / 1000)}.${Math.floor((clamped % 1000) / 100)}`;
  const total = Math.ceil(clamped / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
