-- Soccer has no backfill path for games that age out of The Odds API's
-- scores?daysFrom=3 window (NFL has hardcoded weekN-scores files for this;
-- soccer didn't). admin_resolve_soccer_game() is the soccer equivalent:
-- call it manually from the SQL Editor as service_role/postgres to grade
-- any soccer game (and its picks) regardless of age. Mirrors the
-- spread/moneyline/win-weight logic in resolve-soccer-games/index.ts.
CREATE OR REPLACE FUNCTION public.admin_resolve_soccer_game(p_game_id text, p_home_score integer, p_away_score integer)
RETURNS TABLE(picks_graded integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_home_spread numeric;
  v_winner text;
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

  v_winner := NULL;
  IF v_home_spread IS NOT NULL THEN
    IF (p_home_score + v_home_spread) > p_away_score THEN v_winner := 'home';
    ELSIF (p_home_score + v_home_spread) < p_away_score THEN v_winner := 'away';
    ELSE v_winner := 'push';
    END IF;
  END IF;

  UPDATE games
  SET locked = true,
      game_status = 'final',
      home_score = p_home_score,
      away_score = p_away_score,
      winner = COALESCE(v_winner, winner)
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

    -- Mirror calcWinWeight() from resolve-soccer-games/index.ts
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

-- Lock down to service_role only (and the postgres superuser) — app users
-- (anon/authenticated) must not be able to call this directly.
REVOKE ALL ON FUNCTION public.admin_resolve_soccer_game(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_resolve_soccer_game(text, integer, integer) TO service_role;
