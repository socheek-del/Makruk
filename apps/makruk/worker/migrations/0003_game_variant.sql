-- plat-005c: a stored game says which game it is, so a history row is readable without the Worker.
-- This database only ever holds Makruk games (each product has its own Worker and D1), so existing
-- rows default to 'makruk'.
ALTER TABLE games ADD COLUMN variant TEXT NOT NULL DEFAULT 'makruk';
CREATE INDEX games_variant ON games(variant);
