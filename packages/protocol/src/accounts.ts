/** Accounts, ratings and game history (acct-002, acct-003). */
import { z } from 'zod';
import { Color, GameResult, PublicUser, TimeControl } from './game';

export const TimeClass = z.enum(['bullet', 'blitz', 'rapid', 'classical']);
export type TimeClass = z.infer<typeof TimeClass>;

export const AuthConfigResponse = z.object({
  google: z.boolean(),
  email: z.boolean(),
  /** Only true in local development / E2E environments. */
  testLogin: z.boolean(),
});
export type AuthConfigResponse = z.infer<typeof AuthConfigResponse>;

export const AuthResponse = z.object({ token: z.string(), user: PublicUser });
export type AuthResponse = z.infer<typeof AuthResponse>;

export const MagicLinkRequest = z.object({
  email: z.email(),
  /** Current guest token so the guest's games move to the account. */
  guestToken: z.string().optional(),
  lang: z.enum(['th', 'en']).optional(),
});
export type MagicLinkRequest = z.infer<typeof MagicLinkRequest>;

export const TestLoginRequest = z.object({
  email: z.email(),
  name: z.string().min(1).max(40),
  guestToken: z.string().optional(),
});
export type TestLoginRequest = z.infer<typeof TestLoginRequest>;

export const RatingInfo = z.object({
  timeClass: TimeClass,
  rating: z.number(),
  rd: z.number(),
  games: z.number().int(),
  provisional: z.boolean(),
});
export type RatingInfo = z.infer<typeof RatingInfo>;

export const AccountResponse = z.object({
  user: PublicUser,
  email: z.string().nullable(),
  ratings: z.array(RatingInfo),
});
export type AccountResponse = z.infer<typeof AccountResponse>;

const Side = z.object({ id: z.string(), name: z.string(), kind: z.enum(['guest', 'user']) });

export const GameSummary = z.object({
  id: z.string(),
  code: z.string(),
  white: Side,
  black: Side,
  result: GameResult,
  timeClass: TimeClass.nullable(),
  rated: z.boolean(),
  /** The requesting player's colour and rating change, when they played in this game. */
  yourColor: Color.nullable(),
  ratingChange: z.number().nullable(),
  moveCount: z.number().int(),
  finishedAt: z.number(),
});
export type GameSummary = z.infer<typeof GameSummary>;

export const GameHistoryResponse = z.object({ games: z.array(GameSummary) });
export type GameHistoryResponse = z.infer<typeof GameHistoryResponse>;

export const GameRecordResponse = GameSummary.extend({
  startFen: z.string(),
  moves: z.array(z.string()),
  timeControl: TimeControl.nullable(),
});
export type GameRecordResponse = z.infer<typeof GameRecordResponse>;
