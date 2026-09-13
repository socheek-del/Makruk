/** Clock math is shared with the server via @makruk/engine/clock; formatting is UI-only. */
export {
  type ClockState,
  createClock,
  flaggedSide,
  flagTime,
  pressClock,
  runFor,
  stopClock,
  timesAt,
} from '@makruk/engine/clock';

/** m:ss, or s.t under ten seconds. */
export function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped < 10_000) return `${Math.floor(clamped / 1000)}.${Math.floor((clamped % 1000) / 100)}`;
  const total = Math.ceil(clamped / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
