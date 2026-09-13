/** Accounts, ratings and game history (acct-002, acct-003). */
import { z } from 'zod';
import { Color, GameResult, PublicUser, TimeControl } from './game';

export const TimeClass = z.enum(['bullet', 'blitz', 'rapid', 'classical']);
export type TimeClass = z.infer<typeof TimeClass>;

/** 3–20 characters: English letters, digits and underscore. */
export const Username = z.string().regex(/^[A-Za-z0-9_]{3,20}$/);
export const Password = z.string().min(8).max(128);
const Lang = z.enum(['th', 'en']).optional();

export const AuthConfigResponse = z.object({
  /** Registration and password reset need email delivery. */
  accounts: z.boolean(),
  /** Development only: emails go to /api/dev/outbox instead of being sent. */
  devOutbox: z.boolean(),
});
export type AuthConfigResponse = z.infer<typeof AuthConfigResponse>;

export const AuthResponse = z.object({ token: z.string(), user: PublicUser });
export type AuthResponse = z.infer<typeof AuthResponse>;

export const RegisterRequest = z.object({
  username: Username,
  email: z.email(),
  password: Password,
  /** Current guest token so the guest's games move to the new account. */
  guestToken: z.string().optional(),
  lang: Lang,
});
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export const LoginRequest = z.object({
  /** Username or email. */
  login: z.string().min(1).max(254),
  password: z.string().min(1).max(128),
  guestToken: z.string().optional(),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const ResendVerificationRequest = z.object({ login: z.string().min(1).max(254), lang: Lang });
export type ResendVerificationRequest = z.infer<typeof ResendVerificationRequest>;

export const ForgotPasswordRequest = z.object({ email: z.email(), lang: Lang });
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequest>;

export const ResetPasswordRequest = z.object({ token: z.string().min(16).max(128), password: Password });
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequest>;

export const AuthErrorCode = z.enum([
  'bad_request',
  'username_taken',
  'email_taken',
  'invalid_credentials',
  'email_not_verified',
  'locked',
  'invalid_token',
  'email_unavailable',
]);
export type AuthErrorCode = z.infer<typeof AuthErrorCode>;

export const DevOutboxResponse = z.object({
  emails: z.array(z.object({ to: z.string(), subject: z.string(), html: z.string(), createdAt: z.number() })),
});
export type DevOutboxResponse = z.infer<typeof DevOutboxResponse>;

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
