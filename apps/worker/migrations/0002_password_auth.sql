-- acct-002 (revised): username + password accounts with email confirmation and password reset.
-- Replaces magic-link and Google sign-in.

ALTER TABLE users ADD COLUMN username TEXT;
ALTER TABLE users ADD COLUMN username_lower TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN email_verified_at INTEGER;
ALTER TABLE users ADD COLUMN failed_logins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until INTEGER;
CREATE UNIQUE INDEX users_username_lower ON users(username_lower);

-- One-time tokens for email confirmation ('verify') and password reset ('reset'); only hashes are stored.
CREATE TABLE auth_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  purpose TEXT NOT NULL,
  guest_id TEXT,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX auth_tokens_user ON auth_tokens(user_id, purpose);

-- Development/test only (DEV_EMAIL_OUTBOX=1): emails are stored here instead of being sent.
CREATE TABLE dev_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

DROP TABLE magic_links;
