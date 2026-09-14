import type { Matchmaker } from './match/Matchmaker';
import type { GameRoom } from './room/GameRoom';

export interface Env {
  ASSETS: Fetcher;
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  MATCHMAKER: DurableObjectNamespace<Matchmaker>;
  /** Accounts, ratings and game history. */
  DB: D1Database;
  /** HMAC secret for identity tokens (wrangler secret in production, .dev.vars locally). */
  AUTH_SECRET: string;
  /** How long a disconnected player has to come back before losing by abandonment. */
  RECONNECT_GRACE_MS?: string;
  /** Public site origin used in emailed links, e.g. https://th-chess.beanroti.com */
  PUBLIC_ORIGIN?: string;
  /** Resend API key and verified sender for confirmation and reset emails. Registration is disabled until set. */
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  /** "1" stores emails in the dev_outbox table and exposes GET /api/dev/outbox — local dev and tests only. */
  DEV_EMAIL_OUTBOX?: string;
}
