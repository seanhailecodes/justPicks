-- =============================================================
-- picks: allow one pick per BET TYPE per game.
--
-- The picks table had  unique_user_game UNIQUE (user_id, game_id),
-- so only one pick could exist per game — a second bet (e.g. a
-- moneyline on a game you already picked the spread for) silently
-- overwrote the first.
--
-- This swaps it for uniqueness on (user_id, game_id, bet_type), so
-- a spread, a moneyline, and a total on the same game each get
-- their own row.
--
-- Safe: the old constraint guaranteed at most one row per
-- (user_id, game_id), so no existing row can violate the new one.
--
-- Pairs with the rewritten savePick() in app/lib/supabase.ts.
-- IMPORTANT: run this BEFORE that app code goes live — the new
-- savePick upserts onto this constraint and will error without it.
--
-- Idempotent. Paste into the Supabase SQL Editor, run once.
-- =============================================================

BEGIN;

ALTER TABLE public.picks DROP CONSTRAINT IF EXISTS unique_user_game;
ALTER TABLE public.picks DROP CONSTRAINT IF EXISTS picks_user_game_bettype_key;

ALTER TABLE public.picks
  ADD CONSTRAINT picks_user_game_bettype_key
  UNIQUE (user_id, game_id, bet_type);

COMMIT;


-- =============================================================
-- Verify: picks should now carry the (user_id, game_id, bet_type)
-- unique constraint, and unique_user_game should be gone.
-- =============================================================
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.picks'::regclass AND contype = 'u'
ORDER BY conname;
