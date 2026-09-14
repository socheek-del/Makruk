/** Chess clock arithmetic, shared by every game in @chaturanga/rules-core (kept at this path for the worker). */
export {
  type ClockState,
  createClock,
  flaggedSide,
  flagTime,
  pressClock,
  runFor,
  stopClock,
  timesAt,
} from '@chaturanga/rules-core';
