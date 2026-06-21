-- admin_resolve_soccer_game() (and, separately, the resolve-soccer-games
-- edge function) wrote to a `winner` column on `games` that was never part
-- of the schema -- copied from an early draft and never tested against a
-- real game. Both would 500 on any spread game. Edge function fixed via
-- direct deploy (untracked, like the rest of this repo's edge functions);
-- this migration fixes the DB-side function and is the only one of the two
-- that needs to live in git.
CREATE OR REPLACE FUNCTION public.admin_resolve_soccer_game(p_game_id text, p_home_score integer, p_away_score integer)
RETURNS TABLE(picks_graded integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_home_spread numeric;
  v_count int := 0;
  pick_rec record;
  v_pick_home_spread numeric;
  v_pick_home_covered boolean;
  v_pick_push boolean;
  v_spread_correct boolean;
  v_ml_correct boolean;
  v_correct boolean;
  v_win_weight numeric;
BEGIN
  SELECT home_spread INTO v_home_spread
  FROM games WHERE id = p_game_id AND league = 'SOCCER';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Soccer game % not found', p_game_id;
  END IF;

  UPDATE games
  SET locked = true,
      game_status = 'final',
      home_score = p_home_score,
      away_score = p_away_score
  WHERE id = p_game_id;

  FOR pick_rec IN
    SELECT id, team_picked, bet_type, ml_odds, spread_line_at_pick
    FROM picks WHERE game_id = p_game_id
  LOOP
    v_pick_home_spread := COALESCE(pick_rec.spread_line_at_pick, v_home_spread);
    v_spread_correct := NULL;
    v_pick_push := false;
    IF v_pick_home_spread IS NOT NULL THEN
      v_pick_home_covered := (p_home_score + v_pick_home_spread) > p_away_score;
      v_pick_push := (p_home_score + v_pick_home_spread) = p_away_score;
      IF NOT v_pick_push THEN
        v_spread_correct := pick_rec.team_picked = (CASE WHEN v_pick_home_covered THEN 'home' ELSE 'away' END);
      END IF;
    END IF;

    v_ml_correct := NULL;
    IF pick_rec.team_picked IS NOT NULL THEN
      IF p_home_score = p_away_score THEN
        v_ml_correct := false; -- draw = ML loss (no draw option in current UI)
      ELSE
        v_ml_correct := pick_rec.team_picked = (CASE WHEN p_home_score > p_away_score THEN 'home' ELSE 'away' END);
      END IF;
    END IF;

    v_correct := CASE
      WHEN pick_rec.bet_type = 'total' THEN NULL
      WHEN pick_rec.bet_type = 'moneyline' THEN v_ml_correct
      ELSE v_spread_correct
    END;

    IF v_correct IS NULL THEN
      v_win_weight := 1.0;
    ELSIF pick_rec.bet_type != 'moneyline' OR pick_rec.ml_odds IS NULL THEN
      v_win_weight := 1.0;
    ELSIF v_correct THEN
      v_win_weight := CASE WHEN pick_rec.ml_odds > 0 THEN pick_rec.ml_odds / 100.0 ELSE 100.0 / abs(pick_rec.ml_odds) END;
    ELSE
      v_win_weight := CASE WHEN pick_rec.ml_odds > 0 THEN 100.0 / pick_rec.ml_odds ELSE abs(pick_rec.ml_odds) / 100.0 END;
    END IF;

    UPDATE picks SET correct = v_correct, win_weight = v_win_weight WHERE id = pick_rec.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN QUERY SELECT v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_resolve_soccer_game(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_resolve_soccer_game(text, integer, integer) TO service_role;
