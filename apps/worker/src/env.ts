import type { Matchmaker } from './match/Matchmaker';
import type { GameRoom } from './room/GameRoom';

export interface Env {
  ASSETS: Fetcher;
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  MATCHMAKER: DurableObjectNamespace<Matchmaker>;
  /** HMAC secret for identity tokens (wrangler secret in production, .dev.vars locally). */
  AUTH_SECRET: string;
  /** How long a disconnected player has to come back before losing by abandonment. */
  RECONNECT_GRACE_MS?: string;
}
