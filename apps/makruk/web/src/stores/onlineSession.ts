import { createOnlineSession as createVariantOnlineSession, type OnlineSessionState as VariantOnlineState } from '@chaturanga/game-shell';
import { type Game, makruk } from '@chaturanga/makruk';

export { clockFromSnapshot } from '@chaturanga/game-shell';

/** A Makruk online session (shared adapter in @chaturanga/game-shell). */
export type OnlineSessionState = VariantOnlineState<Game>;

/** Adapts the server-authoritative room to the session interface the Makruk game screen uses. */
export function createOnlineSession() {
  return createVariantOnlineSession(makruk);
}
