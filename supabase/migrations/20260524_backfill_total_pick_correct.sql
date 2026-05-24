-- =============================================================
-- Backfill `correct` on totals (over/under) pick rows.
--
-- A totals bet is its own pick row (bet_type = 'total'). The game
-- resolvers historically wrote the over/under result into
-- over_under_correct but left `correct` NULL on those rows — so
-- every reader keyed on `correct` (Profile record, leaderboards,
-- pick rating, Season Recap streaks) silently dropped O/U picks.
--
-- The resolvers are now fixed to set `correct` on total rows going
-- forward. This backfills the rows already in the table:
--   1. Where the O/U was graded, copy that result into `correct`.
--   2. Where it was never graded (the NCAAB / Soccer resolvers do
--      not compute O/U), clear any stale `correct` so the row reads
--      as ungraded instead of a false loss.
--
-- Safe + idempotent. Paste into the Supabase SQL Editor, run once.
-- =============================================================

BEGIN;

-- 1. Totals rows whose over/under WAS graded — mirror that result.
UPDATE public.picks
SET correct = over_under_correct
WHERE bet_type = 'total'
  AND over_under_correct IS NOT NULL
  AND correct IS DISTINCT FROM over_under_correct;

-- 2. Totals rows whose over/under was never graded — clear any
--    stale value so they read as ungraded rather than a false loss.
UPDATE public.picks
SET correct = NULL
WHERE bet_type = 'total'
  AND over_under_correct IS NULL
  AND correct IS NOT NULL;

COMMIT;


-- =============================================================
-- Verify: every totals row's `correct` should now agree with its
-- over_under_correct (mismatched should be 0).
-- =============================================================
SELECT
  count(*)                                                            AS total_rows,
  count(*) FILTER (WHERE correct IS NOT DISTINCT FROM over_under_correct) AS aligned,
  count(*) FILTER (WHERE correct IS DISTINCT FROM over_under_correct)     AS mismatched
FROM public.picks
WHERE bet_type = 'total';
