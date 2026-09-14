/** D1 access for accounts, ratings and game history. */
import type {
  GameRecordResponse,
  GameResult,
  GameSummary,
  PublicUser,
  RatingInfo,
  TimeClass,
  TimeControl,
} from '@chaturanga/protocol';
import { DEFAULT_RATING, PROVISIONAL_RD, type Rating, rateGame, timeClassOf } from '../ratings/glicko2';

export interface UserRow {
  id: string;
  email: string | null;
  name: string;
  provider: string;
  created_at: number;
  username: string | null;
  username_lower: string | null;
  password_hash: string | null;
  email_verified_at: number | null;
  failed_logins: number;
  locked_until: number | null;
}

const TIME_CLASSES: TimeClass[] = ['bullet', 'blitz', 'rapid', 'classical'];

export function getUser(db: D1Database, id: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
}

/** Looks a user up by username (case-insensitive) or email. */
export function findUserByLogin(db: D1Database, login: string): Promise<UserRow | null> {
  const key = login.trim().toLowerCase();
  return db.prepare('SELECT * FROM users WHERE username_lower = ? OR email = ?').bind(key, key).first<UserRow>();
}

export async function createPasswordUser(
  db: D1Database,
  input: { username: string; email: string; passwordHash: string; now: number },
): Promise<UserRow | 'username_taken' | 'email_taken'> {
  const usernameLower = input.username.toLowerCase();
  const email = input.email.toLowerCase();
  if (await db.prepare('SELECT 1 FROM users WHERE username_lower = ?').bind(usernameLower).first()) return 'username_taken';
  if (await db.prepare('SELECT 1 FROM users WHERE email = ?').bind(email).first()) return 'email_taken';
  const row: UserRow = {
    id: `u_${crypto.randomUUID()}`,
    email,
    name: input.username,
    provider: 'password',
    created_at: input.now,
    username: input.username,
    username_lower: usernameLower,
    password_hash: input.passwordHash,
    email_verified_at: null,
    failed_logins: 0,
    locked_until: null,
  };
  await db
    .prepare(
      `INSERT INTO users (id, email, name, provider, created_at, username, username_lower, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(row.id, row.email, row.name, row.provider, row.created_at, row.username, row.username_lower, row.password_hash)
    .run();
  return row;
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Creates a one-time token and returns the raw value (only its hash is stored). */
export async function createAuthToken(
  db: D1Database,
  input: { userId: string; purpose: 'verify' | 'reset'; ttlMs: number; guestId?: string | null; now: number },
): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await db
    .prepare('INSERT INTO auth_tokens (token_hash, user_id, purpose, guest_id, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(await sha256Hex(token), input.userId, input.purpose, input.guestId ?? null, input.now + input.ttlMs)
    .run();
  return token;
}

/** Atomically marks a valid, unused, unexpired token as used. */
export async function consumeAuthToken(
  db: D1Database,
  token: string,
  purpose: 'verify' | 'reset',
  now: number,
): Promise<{ userId: string; guestId: string | null } | null> {
  const row = await db
    .prepare(
      `UPDATE auth_tokens SET used_at = ? WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?
       RETURNING user_id, guest_id`,
    )
    .bind(now, await sha256Hex(token), purpose, now)
    .first<{ user_id: string; guest_id: string | null }>();
  return row ? { userId: row.user_id, guestId: row.guest_id } : null;
}

export async function markEmailVerified(db: D1Database, userId: string, now: number): Promise<void> {
  await db.prepare('UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?').bind(now, userId).run();
}

/** Sets a new password, clears lockout and invalidates any other outstanding reset links. */
export async function setPassword(db: D1Database, userId: string, passwordHash: string, now: number): Promise<void> {
  await db.batch([
    db.prepare('UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL WHERE id = ?').bind(passwordHash, userId),
    db.prepare("UPDATE auth_tokens SET used_at = ? WHERE user_id = ? AND purpose = 'reset' AND used_at IS NULL").bind(now, userId),
  ]);
}

export const MAX_FAILED_LOGINS = 10;
export const LOCKOUT_MS = 15 * 60_000;

export async function recordLoginFailure(db: D1Database, user: UserRow, now: number): Promise<void> {
  const failures = user.failed_logins + 1;
  if (failures >= MAX_FAILED_LOGINS) {
    await db.prepare('UPDATE users SET failed_logins = 0, locked_until = ? WHERE id = ?').bind(now + LOCKOUT_MS, user.id).run();
  } else {
    await db.prepare('UPDATE users SET failed_logins = ? WHERE id = ?').bind(failures, user.id).run();
  }
}

export async function clearLoginFailures(db: D1Database, userId: string): Promise<void> {
  await db.prepare('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?').bind(userId).run();
}

/** A guest who signs in keeps their games: the guest id now belongs to the account. */
export async function linkGuest(db: D1Database, guestId: string, userId: string, now: number): Promise<void> {
  await db.prepare('INSERT OR IGNORE INTO guest_links (guest_id, user_id, linked_at) VALUES (?, ?, ?)').bind(guestId, userId, now).run();
}

async function identityIds(db: D1Database, user: PublicUser): Promise<string[]> {
  if (user.kind !== 'user') return [user.id];
  const { results } = await db.prepare('SELECT guest_id FROM guest_links WHERE user_id = ?').bind(user.id).all<{ guest_id: string }>();
  return [user.id, ...results.map((r) => r.guest_id)];
}

interface RatingRow extends Rating {
  games: number;
}

async function ratingFor(db: D1Database, userId: string, timeClass: TimeClass): Promise<RatingRow> {
  const row = await db
    .prepare('SELECT rating, rd, vol, games FROM ratings WHERE user_id = ? AND time_class = ?')
    .bind(userId, timeClass)
    .first<RatingRow>();
  return row ?? { ...DEFAULT_RATING, games: 0 };
}

export async function getRatings(db: D1Database, userId: string): Promise<RatingInfo[]> {
  const { results } = await db.prepare('SELECT time_class, rating, rd, games FROM ratings WHERE user_id = ?').bind(userId).all<{
    time_class: TimeClass;
    rating: number;
    rd: number;
    games: number;
  }>();
  return TIME_CLASSES.map((timeClass) => {
    const row = results.find((r) => r.time_class === timeClass);
    const rd = row?.rd ?? DEFAULT_RATING.rd;
    return { timeClass, rating: row?.rating ?? DEFAULT_RATING.rating, rd, games: row?.games ?? 0, provisional: rd > PROVISIONAL_RD };
  });
}

export interface FinishedGame {
  id: string;
  code: string;
  white: PublicUser;
  black: PublicUser;
  startFen: string;
  moves: string[];
  timeControl: TimeControl | null;
  result: GameResult;
  rated: boolean;
  finishedAt: number;
}

/** Only timed games between two signed-in players with at least one move each count for rating. */
export function isRatable(game: Pick<FinishedGame, 'rated' | 'timeControl' | 'white' | 'black' | 'moves'>): boolean {
  return game.rated && !!game.timeControl && game.white.kind === 'user' && game.black.kind === 'user' && game.moves.length >= 2;
}

/** Stores a finished game once (idempotent by id) and applies Glicko-2 updates for rated games. */
export async function recordGame(db: D1Database, game: FinishedGame): Promise<{ inserted: boolean; rated: boolean }> {
  const timeClass = game.timeControl ? timeClassOf(game.timeControl) : null;
  const rated = isRatable(game);
  const insert = await db
    .prepare(
      `INSERT OR IGNORE INTO games (id, code, white_id, black_id, white_name, black_name, white_kind, black_kind, start_fen, moves,
        time_control, time_class, winner, reason, rated, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      game.id,
      game.code,
      game.white.id,
      game.black.id,
      game.white.name,
      game.black.name,
      game.white.kind,
      game.black.kind,
      game.startFen,
      game.moves.join(' '),
      game.timeControl ? JSON.stringify(game.timeControl) : null,
      timeClass,
      game.result.winner,
      game.result.reason,
      rated ? 1 : 0,
      game.finishedAt,
    )
    .run();
  if (!insert.meta.changes) return { inserted: false, rated };
  if (!rated || !timeClass) return { inserted: true, rated: false };

  const white = await ratingFor(db, game.white.id, timeClass);
  const black = await ratingFor(db, game.black.id, timeClass);
  const next = rateGame(white, black, game.result.winner);
  const upsert = `INSERT INTO ratings (user_id, time_class, rating, rd, vol, games, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(user_id, time_class) DO UPDATE SET rating = excluded.rating, rd = excluded.rd, vol = excluded.vol,
    games = ratings.games + 1, updated_at = excluded.updated_at`;
  await db.batch([
    db.prepare(upsert).bind(game.white.id, timeClass, next.white.rating, next.white.rd, next.white.vol, game.finishedAt),
    db.prepare(upsert).bind(game.black.id, timeClass, next.black.rating, next.black.rd, next.black.vol, game.finishedAt),
    db
      .prepare(
        'UPDATE games SET white_rating_before = ?, white_rating_after = ?, black_rating_before = ?, black_rating_after = ? WHERE id = ?',
      )
      .bind(white.rating, next.white.rating, black.rating, next.black.rating, game.id),
  ]);
  return { inserted: true, rated: true };
}

interface GameRow {
  id: string;
  code: string;
  white_id: string;
  black_id: string;
  white_name: string;
  black_name: string;
  white_kind: 'guest' | 'user';
  black_kind: 'guest' | 'user';
  start_fen: string;
  moves: string;
  time_control: string | null;
  time_class: TimeClass | null;
  winner: 'w' | 'b' | null;
  reason: GameResult['reason'];
  rated: number;
  white_rating_before: number | null;
  white_rating_after: number | null;
  black_rating_before: number | null;
  black_rating_after: number | null;
  finished_at: number;
}

function summarize(row: GameRow, viewerIds: readonly string[]): GameSummary {
  const yourColor = viewerIds.includes(row.white_id) ? 'w' : viewerIds.includes(row.black_id) ? 'b' : null;
  const change =
    yourColor === 'w' && row.white_rating_after !== null && row.white_rating_before !== null
      ? row.white_rating_after - row.white_rating_before
      : yourColor === 'b' && row.black_rating_after !== null && row.black_rating_before !== null
        ? row.black_rating_after - row.black_rating_before
        : null;
  return {
    id: row.id,
    code: row.code,
    white: { id: row.white_id, name: row.white_name, kind: row.white_kind },
    black: { id: row.black_id, name: row.black_name, kind: row.black_kind },
    result: { winner: row.winner, reason: row.reason },
    timeClass: row.time_class,
    rated: row.rated === 1,
    yourColor,
    ratingChange: change,
    moveCount: row.moves ? row.moves.split(' ').length : 0,
    finishedAt: row.finished_at,
  };
}

export async function historyFor(db: D1Database, viewer: PublicUser, limit = 50): Promise<GameSummary[]> {
  const ids = await identityIds(db, viewer);
  const placeholders = ids.map(() => '?').join(', ');
  const { results } = await db
    .prepare(`SELECT * FROM games WHERE white_id IN (${placeholders}) OR black_id IN (${placeholders}) ORDER BY finished_at DESC LIMIT ?`)
    .bind(...ids, ...ids, limit)
    .all<GameRow>();
  return results.map((row) => summarize(row, ids));
}

export async function gameRecord(db: D1Database, id: string, viewer: PublicUser | null): Promise<GameRecordResponse | null> {
  const row = await db.prepare('SELECT * FROM games WHERE id = ?').bind(id).first<GameRow>();
  if (!row) return null;
  const ids = viewer ? await identityIds(db, viewer) : [];
  return {
    ...summarize(row, ids),
    startFen: row.start_fen,
    moves: row.moves ? row.moves.split(' ') : [],
    timeControl: row.time_control ? (JSON.parse(row.time_control) as TimeControl) : null,
  };
}
