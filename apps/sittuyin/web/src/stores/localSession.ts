import {
  createGameSession as createVariantSession,
  type GameSessionState as VariantSessionState,
  storageKey,
} from '@chaturanga/game-shell';
import { type Game, sittuyin } from '@chaturanga/sittuyin';
import { PRODUCT } from '../../product.config';

/** A Sittuyin game session (shared session logic in @chaturanga/game-shell). */
export type GameSessionState = VariantSessionState<Game>;
export type GameSessionStore = ReturnType<typeof createGameSession>;

/**
 * A local Sittuyin game session. With `storageKey` the game is saved in localStorage on every change and
 * restored when the page loads, so an accidental refresh does not lose the game — including a half-
 * finished setup, because placements are moves like any other.
 */
export function createGameSession(key?: string) {
  return createVariantSession(sittuyin, key);
}

/** Pass-and-play game on this device. */
export const useLocalSession = createGameSession(storageKey(PRODUCT, 'session.local'));

/** Game against the computer. */
export const useComputerSession = createGameSession(storageKey(PRODUCT, 'session.computer'));
