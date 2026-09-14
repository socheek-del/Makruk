-- Accounts, ratings and game history (acct-002, acct-003).

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  -- 'google' | 'email' | 'test'
  provider TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- A guest identity that signed in: its games belong to the account.
CREATE TABLE guest_links (
  guest_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  linked_at INTEGER NOT NULL
);
CREATE INDEX guest_links_user ON guest_links(user_id);

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  white_id TEXT NOT NULL,
  black_id TEXT NOT NULL,
  white_name TEXT NOT NULL,
  black_name TEXT NOT NULL,
  white_kind TEXT NOT NULL,
  black_kind TEXT NOT NULL,
  start_fen TEXT NOT NULL,
  -- Space-separated coordinate moves (e3e4 d6d5 …).
  moves TEXT NOT NULL,
  -- JSON {initialMs, incrementMs} or NULL for untimed games.
  time_control TEXT,
  time_class TEXT,
  -- 'w' | 'b' | NULL for a draw.
  winner TEXT,
  reason TEXT NOT NULL,
  rated INTEGER NOT NULL DEFAULT 0,
  white_rating_before REAL,
  white_rating_after REAL,
  black_rating_before REAL,
  black_rating_after REAL,
  finished_at INTEGER NOT NULL
);
CREATE INDEX games_white ON games(white_id, finished_at DESC);
CREATE INDEX games_black ON games(black_id, finished_at DESC);

-- Glicko-2 rating per user and time class.
CREATE TABLE ratings (
  user_id TEXT NOT NULL REFERENCES users(id),
  time_class TEXT NOT NULL,
  rating REAL NOT NULL,
  rd REAL NOT NULL,
  vol REAL NOT NULL,
  games INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, time_class)
);

-- One-time email sign-in links; only a hash of the token is stored.
CREATE TABLE magic_links (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  guest_id TEXT,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
