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
  /** Public site origin used in sign-in links and OAuth redirects, e.g. https://th-chess.beanroti.com */
  PUBLIC_ORIGIN?: string;
  /** Google OAuth web client (acct-002). Sign-in with Google is disabled until both are set. */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Resend API key and verified sender for magic-link emails. Email sign-in is disabled until set. */
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  /** "1" enables POST /api/auth/test-login for local development and E2E tests only. */
  ALLOW_TEST_LOGIN?: string;
}
