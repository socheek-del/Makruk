/**
 * Online game protocol. The server is authoritative: clients send intents, the server replies
 * with full `state` snapshots. There is intentionally no chat message of any kind.
 */
import { z } from 'zod';

export const Color = z.enum(['w', 'b']);
export type Color = z.infer<typeof Color>;

export const TimeControl = z.object({
  initialMs: z.number().int().min(0).max(3 * 3_600_000),
  incrementMs: z.number().int().min(0).max(60_000),
});
export type TimeControl = z.infer<typeof TimeControl>;

export const ResultReason = z.enum([
  'checkmate',
  'stalemate',
  'repetition',
  'counting',
  'insufficient-material',
  'timeout',
  'resign',
  'agreement',
  'abandon',
]);

export const GameResult = z.object({ winner: Color.nullable(), reason: ResultReason });
export type GameResult = z.infer<typeof GameResult>;

export const PublicUser = z.object({
  id: z.string(),
  /** Display name; guests get a short numeric tag the client localizes. */
  name: z.string(),
  kind: z.enum(['guest', 'user']),
});
export type PublicUser = z.infer<typeof PublicUser>;

export const SeatInfo = PublicUser.extend({ connected: z.boolean() });

export const GameSnapshot = z.object({
  code: z.string(),
  /** Server timestamp (ms) when this snapshot was taken; clients use it for countdowns. */
  serverTime: z.number(),
  status: z.enum(['waiting', 'playing', 'finished']),
  startFen: z.string(),
  /** Moves in coordinate notation, e.g. e3e4, a5a6m. */
  moves: z.array(z.string()),
  players: z.object({ w: SeatInfo.nullable(), b: SeatInfo.nullable() }),
  timeControl: TimeControl.nullable(),
  /** Remaining ms at `serverTime`; the running side keeps counting down from there. */
  clock: z.object({ w: z.number(), b: z.number(), running: Color.nullable(), serverTime: z.number() }).nullable(),
  result: GameResult.nullable(),
  drawOfferBy: Color.nullable(),
  rematchOfferBy: Color.nullable(),
  /** Set when both players accepted a rematch: clients move to this room. */
  nextCode: z.string().nullable(),
  /** A disconnected player loses by abandonment if not back by `at`. */
  disconnect: z.object({ color: Color, at: z.number() }).nullable(),
});
export type GameSnapshot = z.infer<typeof GameSnapshot>;

const UCI = z.string().regex(/^[a-h][1-8][a-h][1-8]m?$/);

export const ClientMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('move'), uci: UCI, ply: z.number().int().min(0) }),
  z.object({ type: z.literal('resign') }),
  z.object({ type: z.literal('offerDraw') }),
  z.object({ type: z.literal('acceptDraw') }),
  z.object({ type: z.literal('declineDraw') }),
  z.object({ type: z.literal('rematch') }),
  z.object({ type: z.literal('ping'), t: z.number() }),
]);
export type ClientMessage = z.infer<typeof ClientMessage>;

export const ErrorCode = z.enum([
  'bad_message',
  'unauthorized',
  'not_a_player',
  'not_your_turn',
  'stale_ply',
  'illegal_move',
  'game_not_started',
  'game_over',
]);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const ServerMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('state'), you: Color.nullable(), game: GameSnapshot }),
  z.object({ type: z.literal('error'), code: ErrorCode }),
  z.object({ type: z.literal('pong'), t: z.number(), serverTime: z.number() }),
]);
export type ServerMessage = z.infer<typeof ServerMessage>;

// ---- Quick match ----

/** Quick-match pools and their time controls. */
export const QUICK_POOLS = {
  '3+2': { initialMs: 180_000, incrementMs: 2_000 },
  '5+0': { initialMs: 300_000, incrementMs: 0 },
  '10+0': { initialMs: 600_000, incrementMs: 0 },
} as const satisfies Record<string, TimeControl>;

export const QuickPool = z.enum(['3+2', '5+0', '10+0']);
export type QuickPool = z.infer<typeof QuickPool>;

export const MatchServerMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('queued'), pool: QuickPool }),
  z.object({ type: z.literal('matched'), code: z.string() }),
  z.object({ type: z.literal('error'), code: z.enum(['bad_pool', 'unavailable']) }),
]);
export type MatchServerMessage = z.infer<typeof MatchServerMessage>;

// ---- REST ----

export const GuestResponse = z.object({ token: z.string(), user: PublicUser });
export type GuestResponse = z.infer<typeof GuestResponse>;

export const CreateGameRequest = z.object({
  timeControl: TimeControl.nullable(),
  color: z.enum(['w', 'b', 'random']),
});
export type CreateGameRequest = z.infer<typeof CreateGameRequest>;

export const RoomCode = z.string().regex(/^[A-HJ-NP-Z2-9]{6}$/);

export const CreateGameResponse = z.object({ code: RoomCode });
export type CreateGameResponse = z.infer<typeof CreateGameResponse>;

export const RoomSummary = z.object({
  code: RoomCode,
  status: z.enum(['waiting', 'playing', 'finished']),
  timeControl: TimeControl.nullable(),
  openColor: Color.nullable(),
});
export type RoomSummary = z.infer<typeof RoomSummary>;
