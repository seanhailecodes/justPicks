-- =============================================================
-- 2026-09-12 recovery migration
--
-- 1. NFL week/season derived from dates (no hardcoded 2025).
--    - nfl_week_for(ts): Tuesday-after-Labor-Day clock, weeks 1–22.
--    - advance_nfl_week(): now sets app_state.season + current_week
--      from today's date instead of incrementing a 2025-only counter.
--    - Backfill week on the 2026 NFL rows that were all tagged 22.
-- 2. Apply the never-run 20260523_lock_down_group_visibility changes
--    (drop the anonymous groups read policy; add the two invite RPCs
--    the app already calls) and add join_group_by_code() so
--    invite-code joins no longer collide with the self-join RLS rule.
-- 3. Data hygiene: grade legacy over/under picks that were never
--    graded, void stale games that can no longer be scored.
--
-- Idempotent.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- 1a. NFL week for any timestamp.
--     Season = year the season starts (July 1 cutoff, ET).
--     Clock start = Tuesday after Labor Day (first Monday of Sep), 00:00 ET.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nfl_season_for(_ts timestamptz)
  RETURNS integer
  LANGUAGE sql
  IMMUTABLE
  SET search_path = public
AS $$
  SELECT CASE
    WHEN extract(month FROM (_ts AT TIME ZONE 'America/New_York')) >= 7
      THEN extract(year FROM (_ts AT TIME ZONE 'America/New_York'))::int
    ELSE extract(year FROM (_ts AT TIME ZONE 'America/New_York'))::int - 1
  END;
$$;

CREATE OR REPLACE FUNCTION public.nfl_week_for(_ts timestamptz)
  RETURNS integer
  LANGUAGE sql
  IMMUTABLE
  SET search_path = public
AS $$
  WITH s AS (SELECT public.nfl_season_for(_ts) AS season),
  clock AS (
    SELECT
      -- first Monday of September, plus one day → Tuesday
      (make_date(season, 9, 1)
        + ((8 - extract(dow FROM make_date(season, 9, 1))::int) % 7)
        + 1)::timestamp AT TIME ZONE 'America/New_York' AS start_ts
    FROM s
  )
  SELECT GREATEST(1, LEAST(22,
    floor(extract(epoch FROM (_ts - start_ts)) / 604800)::int + 1))
  FROM clock;
$$;

-- -------------------------------------------------------------
-- 1b. app_state rollover: date-driven, safe to run daily.
--     Keeps the historical function name so existing callers work.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.advance_nfl_week()
  RETURNS void
  LANGUAGE plpgsql
  SET search_path = public
AS $$
DECLARE
  v_now    timestamptz := now();
  v_season int := public.nfl_season_for(v_now);
  v_week   int := public.nfl_week_for(v_now);
BEGIN
  UPDATE public.app_state
     SET season = v_season,
         current_week = v_week,
         updated_at = v_now
   WHERE id = 1;
  RAISE NOTICE 'app_state → season %, week %', v_season, v_week;
END;
$$;

SELECT public.advance_nfl_week();

-- -------------------------------------------------------------
-- 1c. Backfill: every 2026 NFL row was tagged week 22.
--     games.game_date is a naive UTC timestamp.
-- -------------------------------------------------------------
UPDATE public.games
   SET week = public.nfl_week_for(game_date AT TIME ZONE 'UTC')
 WHERE league = 'NFL'
   AND season = 2026
   AND week IS DISTINCT FROM public.nfl_week_for(game_date AT TIME ZONE 'UTC');

-- -------------------------------------------------------------
-- 2a. Lock down group visibility (from 20260523, never applied).
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view group names" ON public.groups;

CREATE OR REPLACE FUNCTION public.get_group_name_for_invite(_invite_id uuid)
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT g.name
  FROM public.group_invites gi
  JOIN public.groups g ON g.id = gi.group_id
  WHERE gi.id = _invite_id
    AND gi.status = 'pending';
$$;

CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(_code text)
  RETURNS TABLE (id uuid, name text, created_by uuid)
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT g.id, g.name, g.created_by
  FROM public.groups g
  WHERE g.invite_code = upper(_code);
$$;

REVOKE ALL ON FUNCTION public.get_group_name_for_invite(uuid) FROM public;
REVOKE ALL ON FUNCTION public.get_group_by_invite_code(text)  FROM public;
GRANT EXECUTE ON FUNCTION public.get_group_name_for_invite(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_by_invite_code(text)  TO anon, authenticated;

-- -------------------------------------------------------------
-- 2b. Join a group by invite code.
--     Validates the code server-side and inserts under definer
--     rights, so invite_only groups are joinable by anyone who
--     actually holds the code — without loosening the RLS self-join
--     rule for everyone else.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_group_by_code(_code text)
  RETURNS TABLE (group_id uuid, group_name text, already_member boolean)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_gid   uuid;
  v_name  text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to join a group' USING ERRCODE = '28000';
  END IF;

  SELECT g.id, g.name INTO v_gid, v_name
  FROM public.groups g
  WHERE g.invite_code = upper(coalesce(_code, ''))
  LIMIT 1;

  IF v_gid IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (SELECT 1 FROM public.group_members gm
             WHERE gm.group_id = v_gid AND gm.user_id = v_uid) THEN
    RETURN QUERY SELECT v_gid, v_name, true;
    RETURN;
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_gid, v_uid, 'member');

  RETURN QUERY SELECT v_gid, v_name, false;
END;
$$;

REVOKE ALL ON FUNCTION public.join_group_by_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;

-- -------------------------------------------------------------
-- 3a. Grade legacy over/under picks that were stored with
--     bet_type 'spread' (team_picked NULL, over_under_pick set)
--     and never graded. Grade against the line the user saw when
--     available, else the game line. Pushes stay NULL.
-- -------------------------------------------------------------
WITH target AS (
  SELECT p.id,
         p.over_under_pick,
         g.home_score + g.away_score                              AS total_pts,
         coalesce(p.total_line_at_pick, g.over_under_line)        AS line
  FROM public.picks p
  JOIN public.games g ON g.id = p.game_id
  WHERE p.correct IS NULL
    AND p.result  IS NULL
    AND p.team_picked IS NULL
    AND p.over_under_pick IN ('over', 'under')
    AND g.game_status = 'final'
    AND g.home_score IS NOT NULL AND g.away_score IS NOT NULL
), graded AS (
  SELECT id,
         CASE
           WHEN line IS NULL OR total_pts = line THEN NULL
           WHEN over_under_pick = 'over'  THEN total_pts > line
           ELSE total_pts < line
         END AS ou_correct
  FROM target
)
UPDATE public.picks p
   SET over_under_correct = gr.ou_correct,
       correct            = gr.ou_correct,
       resolved_at        = now(),
       bet_type = CASE
         WHEN p.bet_type <> 'total'
          AND NOT EXISTS (SELECT 1 FROM public.picks q
                          WHERE q.user_id = p.user_id AND q.game_id = p.game_id
                            AND q.bet_type = 'total' AND q.id <> p.id)
         THEN 'total' ELSE p.bet_type END
  FROM graded gr
 WHERE p.id = gr.id;

-- -------------------------------------------------------------
-- 3b. Void games that finished more than a week ago without a
--     score — the resolver only looks back 3 days, so these would
--     otherwise sit "in progress" forever. Golf keeps its own
--     tournament-based resolver and is left alone.
-- -------------------------------------------------------------
UPDATE public.games
   SET game_status = 'voided'
 WHERE game_status IN ('in_progress', 'pending', 'scheduled')
   AND home_score IS NULL
   AND league <> 'PGA'
   AND game_date < now() - interval '7 days';

COMMIT;
