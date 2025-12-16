--
-- PostgreSQL database dump
--

\restrict 4c6BGVawb7cUeTKepckT1QcxqpVcmzHFkCi3ExLe6wRTzTKXghAaNNxwp7vRJfM

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id, 
    new.email,
    SPLIT_PART(new.email, '@', 1)
  );
  RETURN new;
END;
$$;


--
-- Name: populate_pick_context(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.populate_pick_context() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_game RECORD;
  v_picked_situation RECORD;
  v_opponent_situation RECORD;
  v_picked_team TEXT;
  v_opponent_team TEXT;
BEGIN
  -- Get game details
  SELECT * INTO v_game FROM games WHERE id = NEW.game_id;
  
  IF FOUND THEN
    -- Determine picked and opponent teams
    IF NEW.team_picked = 'home' THEN
      v_picked_team := v_game.home_team;
      v_opponent_team := v_game.away_team;
    ELSE
      v_picked_team := v_game.away_team;
      v_opponent_team := v_game.home_team;
    END IF;
    
    -- Get team situations
    SELECT * INTO v_picked_situation 
    FROM team_situations 
    WHERE team = v_picked_team AND week = v_game.week AND season = v_game.season;
    
    SELECT * INTO v_opponent_situation 
    FROM team_situations 
    WHERE team = v_opponent_team AND week = v_game.week AND season = v_game.season;
    
    -- Populate game context
    NEW.picked_team := v_picked_team;
    NEW.opponent_team := v_opponent_team;
    NEW.game_is_primetime := COALESCE(v_game.is_primetime, false);
    NEW.game_is_divisional := COALESCE(v_game.is_divisional, false);
    NEW.game_is_international := COALESCE(v_game.is_international, false);
    NEW.game_day_of_week := v_game.day_of_week;
    NEW.spread_size := ABS(COALESCE(v_game.home_spread, 0));
    
    -- Spread category
    IF NEW.spread_size <= 1 THEN
      NEW.spread_category := 'pk';
    ELSIF NEW.spread_size <= 3 THEN
      NEW.spread_category := 'small';
    ELSIF NEW.spread_size <= 7 THEN
      NEW.spread_category := 'medium';
    ELSE
      NEW.spread_category := 'large';
    END IF;
    
    -- Favorite/underdog
    IF NEW.team_picked = 'home' THEN
      NEW.picked_favorite := COALESCE(v_game.home_spread, 0) < 0;
    ELSE
      NEW.picked_favorite := COALESCE(v_game.away_spread, 0) < 0;
    END IF;
    
    -- Team situation context
    IF v_picked_situation IS NOT NULL THEN
      NEW.picked_team_days_rest := v_picked_situation.days_rest;
      NEW.picked_team_short_rest := v_picked_situation.is_short_rest;
      NEW.picked_team_off_bye := v_picked_situation.coming_off_bye;
      NEW.picked_team_travel_miles := v_picked_situation.travel_miles;
      NEW.picked_team_injury_score := v_picked_situation.injury_impact_score;
      NEW.picked_team_streak := v_picked_situation.streak;
      NEW.picked_team_ats_record := v_picked_situation.ats_wins || '-' || v_picked_situation.ats_losses;
    END IF;
    
    IF v_opponent_situation IS NOT NULL THEN
      NEW.opponent_days_rest := v_opponent_situation.days_rest;
      NEW.opponent_short_rest := v_opponent_situation.is_short_rest;
      NEW.opponent_off_bye := v_opponent_situation.coming_off_bye;
      NEW.opponent_injury_score := v_opponent_situation.injury_impact_score;
    END IF;
    
    -- Public betting alignment
    IF v_game.public_spread_ticket_pct IS NOT NULL THEN
      NEW.public_pct_at_pick := v_game.public_spread_ticket_pct;
      NEW.with_public := (NEW.picked_favorite AND v_game.public_spread_ticket_pct > 50) 
                      OR (NOT NEW.picked_favorite AND v_game.public_spread_ticket_pct < 50);
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_recommendations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    game_id text NOT NULL,
    bet_type text NOT NULL,
    recommended_side text NOT NULL,
    recommended_team text,
    confidence_score numeric(3,2),
    expected_value numeric(5,2),
    primary_reason text,
    reasoning_full text,
    key_factors jsonb,
    user_edge_factors text[],
    user_relevant_record text,
    user_avoid_factors text[],
    similar_picks jsonb,
    similar_record jsonb,
    line_at_recommendation numeric(4,1),
    public_pct_at_recommendation integer,
    user_viewed boolean DEFAULT false,
    viewed_at timestamp with time zone,
    user_action text,
    user_pick_id uuid,
    recommendation_correct boolean,
    cover_margin numeric(4,1),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: app_state; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_state (
    id integer DEFAULT 1 NOT NULL,
    current_week integer DEFAULT 4 NOT NULL,
    season integer DEFAULT 2025 NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: friendships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    friend_id uuid NOT NULL,
    status text DEFAULT 'accepted'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT friendships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'blocked'::text])))
);


--
-- Name: games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.games (
    id text NOT NULL,
    home_team text,
    away_team text,
    home_spread text,
    away_spread text,
    league text,
    game_date timestamp without time zone,
    locked boolean DEFAULT false,
    week integer,
    season integer,
    created_at timestamp without time zone DEFAULT now(),
    game_status character varying(20) DEFAULT 'pending'::character varying,
    home_score integer,
    away_score integer,
    resolved_at timestamp without time zone,
    over_under numeric(5,1),
    over_under_line numeric,
    is_primetime boolean DEFAULT false,
    broadcast text,
    day_of_week text,
    time_slot text,
    kickoff_hour integer,
    is_divisional boolean DEFAULT false,
    is_rivalry boolean DEFAULT false,
    is_conference boolean DEFAULT true,
    is_international boolean DEFAULT false,
    international_location text,
    neutral_site boolean DEFAULT false,
    is_playoff boolean DEFAULT false,
    playoff_round text,
    playoff_implications text,
    stadium text,
    stadium_type text DEFAULT 'outdoor'::text,
    surface_type text DEFAULT 'grass'::text,
    altitude_feet integer DEFAULT 0,
    weather_condition text,
    temperature_f integer,
    wind_mph integer,
    precipitation_chance integer,
    home_days_rest integer,
    away_days_rest integer,
    home_prev_game_date date,
    away_prev_game_date date,
    away_travel_miles integer DEFAULT 0,
    away_timezone_change integer DEFAULT 0,
    home_coming_off_bye boolean DEFAULT false,
    away_coming_off_bye boolean DEFAULT false,
    home_short_rest boolean DEFAULT false,
    away_short_rest boolean DEFAULT false,
    is_revenge_game_home boolean DEFAULT false,
    is_revenge_game_away boolean DEFAULT false,
    home_coach_vs_former_team boolean DEFAULT false,
    away_coach_vs_former_team boolean DEFAULT false,
    notable_qb_vs_former_team boolean DEFAULT false,
    last_meeting_winner text,
    last_meeting_margin integer,
    opening_spread numeric(4,1),
    opening_total numeric(4,1),
    opening_home_ml integer,
    opening_away_ml integer,
    closing_spread numeric(4,1),
    closing_total numeric(4,1),
    closing_home_ml integer,
    closing_away_ml integer,
    spread_movement numeric(4,1),
    total_movement numeric(4,1),
    public_spread_ticket_pct integer,
    public_spread_money_pct integer,
    public_total_ticket_pct integer,
    public_total_money_pct integer,
    sharp_money_side text,
    reverse_line_movement boolean DEFAULT false,
    home_covered boolean,
    away_covered boolean,
    spread_push boolean DEFAULT false,
    actual_total integer,
    went_over boolean,
    total_push boolean DEFAULT false,
    cover_margin numeric(4,1),
    total_margin numeric(4,1),
    home_margin integer,
    was_upset boolean DEFAULT false,
    was_blowout boolean DEFAULT false,
    was_close boolean DEFAULT false,
    home_moneyline integer,
    away_moneyline integer
);


--
-- Name: COLUMN games.home_moneyline; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.games.home_moneyline IS 'Moneyline odds for home team (e.g., -180 means bet $180 to win $100)';


--
-- Name: COLUMN games.away_moneyline; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.games.away_moneyline IS 'Moneyline odds for away team (e.g., +150 means bet $100 to win $150)';


--
-- Name: group_invites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid,
    invited_by uuid,
    invitee_email text NOT NULL,
    status text DEFAULT 'pending'::text,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone DEFAULT (now() + '7 days'::interval),
    CONSTRAINT group_invites_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])))
);


--
-- Name: group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_members (
    group_id uuid NOT NULL,
    user_id uuid NOT NULL,
    joined_at timestamp without time zone DEFAULT now(),
    role text DEFAULT 'member'::text,
    CONSTRAINT group_members_role_check CHECK ((role = ANY (ARRAY['primary_owner'::text, 'owner'::text, 'admin'::text, 'member'::text])))
);


--
-- Name: group_picks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_picks (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    group_id uuid,
    pick_id uuid,
    user_id uuid,
    shared_at timestamp without time zone DEFAULT now()
);


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    visibility text DEFAULT 'private'::text,
    join_type text DEFAULT 'invite_only'::text,
    invite_code text,
    require_approval boolean DEFAULT false,
    description text,
    primary_sport text DEFAULT 'nfl'::text,
    accuracy_rating numeric(5,2) DEFAULT 0,
    activity_score integer DEFAULT 0,
    member_count integer DEFAULT 0,
    sport text DEFAULT 'nfl'::text NOT NULL,
    CONSTRAINT groups_join_type_check CHECK ((join_type = ANY (ARRAY['invite_only'::text, 'request_to_join'::text, 'open'::text]))),
    CONSTRAINT groups_primary_sport_check CHECK ((primary_sport = ANY (ARRAY['nfl'::text, 'nba'::text, 'mlb'::text, 'multi'::text]))),
    CONSTRAINT groups_sport_check CHECK ((sport = ANY (ARRAY['nfl'::text, 'nba'::text, 'mlb'::text]))),
    CONSTRAINT groups_visibility_check CHECK ((visibility = ANY (ARRAY['private'::text, 'public'::text])))
);


--
-- Name: matchup_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matchup_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    team1 text NOT NULL,
    team2 text NOT NULL,
    team1_wins integer DEFAULT 0,
    team2_wins integer DEFAULT 0,
    ties integer DEFAULT 0,
    recent_meetings jsonb DEFAULT '[]'::jsonb,
    team1_recent_wins integer DEFAULT 0,
    team2_recent_wins integer DEFAULT 0,
    team1_ats_wins integer DEFAULT 0,
    team2_ats_wins integer DEFAULT 0,
    avg_total_points numeric(4,1),
    over_pct numeric(4,1),
    avg_margin numeric(4,1),
    last_updated timestamp with time zone DEFAULT now()
);


--
-- Name: pick_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pick_groups (
    pick_id uuid NOT NULL,
    group_id uuid NOT NULL
);


--
-- Name: picks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.picks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    game_id text NOT NULL,
    pick text NOT NULL,
    confidence text,
    reasoning text,
    pick_type text DEFAULT 'solo'::text,
    groups text[],
    result text,
    created_at timestamp without time zone DEFAULT now(),
    season integer DEFAULT 2025,
    team_picked character varying(50),
    spread_value numeric(3,1),
    week integer,
    locked boolean DEFAULT false,
    correct boolean,
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp without time zone,
    over_under_pick text,
    over_under_correct boolean,
    over_under_confidence text,
    spread_line_at_pick numeric(4,1),
    total_line_at_pick numeric(4,1),
    moneyline_at_pick integer,
    time_before_game_minutes integer,
    picked_at_time text,
    picked_day_of_week text,
    pick_source text,
    notes text,
    public_pct_at_pick integer,
    with_public boolean,
    line_moved_after_pick boolean,
    line_move_direction text,
    picked_favorite boolean,
    spread_size numeric(4,1),
    spread_category text,
    game_is_primetime boolean,
    game_is_divisional boolean,
    game_is_international boolean,
    game_day_of_week text,
    picked_team text,
    opponent_team text,
    picked_team_days_rest integer,
    opponent_days_rest integer,
    picked_team_short_rest boolean,
    opponent_short_rest boolean,
    picked_team_off_bye boolean,
    opponent_off_bye boolean,
    picked_team_travel_miles integer,
    picked_team_injury_score integer,
    opponent_injury_score integer,
    picked_team_streak integer,
    picked_team_ats_record text,
    closing_line numeric(4,1),
    got_best_number boolean,
    line_value numeric(4,1),
    cover_margin numeric(4,1),
    was_close boolean,
    bad_beat boolean,
    backdoor_cover boolean,
    CONSTRAINT picks_confidence_check CHECK ((confidence = ANY (ARRAY['Very Low'::text, 'Low'::text, 'Medium'::text, 'High'::text, 'Very High'::text]))),
    CONSTRAINT picks_over_under_pick_check CHECK ((over_under_pick = ANY (ARRAY['over'::text, 'under'::text, NULL::text]))),
    CONSTRAINT picks_pick_source_check CHECK ((pick_source = ANY (ARRAY['gut'::text, 'research'::text, 'model'::text, 'following_expert'::text, 'contrarian'::text, 'revenge'::text, 'streak'::text, 'matchup'::text, 'injury_news'::text, 'weather'::text, 'ai_suggested'::text, 'other'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username text,
    phone text,
    created_at timestamp without time zone DEFAULT now(),
    win_rate integer DEFAULT 0,
    total_picks integer DEFAULT 0,
    correct_picks integer DEFAULT 0,
    display_name text,
    email text,
    avatar_url text,
    updated_at timestamp with time zone DEFAULT now(),
    tier text DEFAULT 'free'::text
);


--
-- Name: stadium_distances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stadium_distances (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    team1 text NOT NULL,
    team2 text NOT NULL,
    distance_miles integer NOT NULL,
    timezone_diff integer DEFAULT 0
);


--
-- Name: team_situations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_situations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    team text NOT NULL,
    week integer NOT NULL,
    season integer DEFAULT 2025,
    opponent text,
    is_home boolean,
    days_rest integer DEFAULT 7,
    prev_game_date date,
    is_short_rest boolean DEFAULT false,
    coming_off_bye boolean DEFAULT false,
    travel_miles integer DEFAULT 0,
    timezone_change integer DEFAULT 0,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    ties integer DEFAULT 0,
    win_pct numeric(4,3) DEFAULT 0,
    streak integer DEFAULT 0,
    last_5 text,
    ats_wins integer DEFAULT 0,
    ats_losses integer DEFAULT 0,
    ats_pushes integer DEFAULT 0,
    ats_pct numeric(4,3) DEFAULT 0,
    ats_last_5 text,
    home_record text,
    away_record text,
    home_ats text,
    away_ats text,
    points_per_game numeric(4,1) DEFAULT 0,
    points_allowed_per_game numeric(4,1) DEFAULT 0,
    point_differential integer DEFAULT 0,
    avg_total_points numeric(4,1) DEFAULT 0,
    offensive_rank integer,
    defensive_rank integer,
    overall_dvoa_rank integer,
    turnover_diff integer DEFAULT 0,
    third_down_pct numeric(4,1),
    red_zone_pct numeric(4,1),
    sack_diff integer DEFAULT 0,
    injury_impact_score integer DEFAULT 0,
    qb_status text DEFAULT 'starter'::text,
    qb_name text,
    backup_qb_name text,
    key_injuries jsonb DEFAULT '[]'::jsonb,
    total_players_out integer DEFAULT 0,
    total_players_questionable integer DEFAULT 0,
    is_favored boolean,
    spread numeric(4,1),
    implied_total numeric(4,1),
    ats_as_favorite text,
    ats_as_underdog text,
    over_under_record text,
    primetime_record text,
    divisional_record text,
    after_bye_record text,
    short_rest_record text,
    power_rating numeric(5,2),
    elo_rating integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_analytics (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    total_picks integer DEFAULT 0,
    total_spread_picks integer DEFAULT 0,
    total_total_picks integer DEFAULT 0,
    total_ml_picks integer DEFAULT 0,
    total_wins integer DEFAULT 0,
    total_losses integer DEFAULT 0,
    total_pushes integer DEFAULT 0,
    win_rate numeric(5,2) DEFAULT 0,
    roi numeric(6,2) DEFAULT 0,
    high_conf jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    medium_conf jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    low_conf jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    spread_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    total_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    ml_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    pk_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    small_spread_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    medium_spread_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    large_spread_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    favorite_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    underdog_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    home_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    away_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    over_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    under_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    primetime_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    divisional_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    thursday_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    sunday_early_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    sunday_late_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    monday_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    international_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    with_public_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    against_public_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    heavy_public_fade_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    short_rest_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    off_bye_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    rest_advantage_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    travel_disadvantage_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    revenge_game_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    high_injury_team_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    injury_advantage_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    bad_weather_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    dome_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    team_stats jsonb DEFAULT '{}'::jsonb,
    best_teams text[] DEFAULT '{}'::text[],
    worst_teams text[] DEFAULT '{}'::text[],
    most_picked_teams text[] DEFAULT '{}'::text[],
    early_week_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    mid_week_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    game_day_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    avg_time_before_game_hours numeric(6,1) DEFAULT 0,
    got_best_number_stats jsonb DEFAULT '{"rate": 0, "wins": 0, "picks": 0, "losses": 0}'::jsonb,
    avg_line_value numeric(4,2) DEFAULT 0,
    close_games_won integer DEFAULT 0,
    close_games_lost integer DEFAULT 0,
    bad_beats integer DEFAULT 0,
    backdoor_covers integer DEFAULT 0,
    current_streak integer DEFAULT 0,
    longest_win_streak integer DEFAULT 0,
    longest_loss_streak integer DEFAULT 0,
    favorite_lean integer DEFAULT 50,
    home_lean integer DEFAULT 50,
    over_lean integer DEFAULT 50,
    public_lean integer DEFAULT 50,
    primetime_lean integer DEFAULT 50,
    chalk_lean integer DEFAULT 50,
    games_viewed integer DEFAULT 0,
    games_picked integer DEFAULT 0,
    pick_through_rate numeric(5,2) DEFAULT 0,
    avg_confidence text DEFAULT 'Medium'::text,
    changes_picks boolean DEFAULT false,
    ai_recommendations_received integer DEFAULT 0,
    ai_recommendations_followed integer DEFAULT 0,
    ai_follow_rate numeric(5,2) DEFAULT 0,
    ai_followed_wins integer DEFAULT 0,
    ai_followed_losses integer DEFAULT 0,
    ai_ignored_would_have_won integer DEFAULT 0,
    ai_ignored_would_have_lost integer DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now()
);


--
-- Name: user_game_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_game_views (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    game_id text NOT NULL,
    first_viewed_at timestamp with time zone DEFAULT now(),
    last_viewed_at timestamp with time zone DEFAULT now(),
    view_count integer DEFAULT 1,
    total_view_seconds integer DEFAULT 0,
    expanded_details boolean DEFAULT false,
    viewed_team_stats boolean DEFAULT false,
    viewed_injuries boolean DEFAULT false,
    viewed_weather boolean DEFAULT false,
    viewed_public_betting boolean DEFAULT false,
    added_to_ticket boolean DEFAULT false,
    removed_from_ticket boolean DEFAULT false,
    final_action text,
    pick_id uuid,
    week integer,
    season integer DEFAULT 2025
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    favorite_teams text[] DEFAULT '{}'::text[],
    avoided_teams text[] DEFAULT '{}'::text[],
    rival_teams text[] DEFAULT '{}'::text[],
    risk_tolerance text DEFAULT 'moderate'::text,
    bankroll_approach text DEFAULT 'recreational'::text,
    preferred_bet_types text[] DEFAULT '{spread}'::text[],
    preferred_spread_sizes text[] DEFAULT '{}'::text[],
    avoid_large_spreads boolean DEFAULT false,
    prefer_underdogs boolean DEFAULT false,
    prefer_favorites boolean DEFAULT false,
    prefer_primetime boolean DEFAULT false,
    prefer_early_games boolean DEFAULT false,
    avoid_thursday boolean DEFAULT false,
    avoid_international boolean DEFAULT false,
    love_divisional boolean DEFAULT false,
    fade_public boolean DEFAULT false,
    fade_public_threshold integer DEFAULT 70,
    like_revenge_games boolean DEFAULT false,
    trust_bye_week_teams boolean DEFAULT true,
    avoid_short_rest boolean DEFAULT false,
    like_weather_games boolean DEFAULT false,
    avoid_dome_teams_outdoors boolean DEFAULT false,
    experience_level text DEFAULT 'intermediate'::text,
    primary_goal text DEFAULT 'fun'::text,
    notify_game_start boolean DEFAULT true,
    notify_results boolean DEFAULT true,
    notify_recommendations boolean DEFAULT true,
    notify_line_movement boolean DEFAULT false,
    notify_injury_updates boolean DEFAULT false,
    notify_weather_alerts boolean DEFAULT false,
    ai_aggressiveness text DEFAULT 'moderate'::text,
    ai_explain_reasoning boolean DEFAULT true,
    ai_show_confidence boolean DEFAULT true,
    ai_suggest_fades boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_preferences_bankroll_approach_check CHECK ((bankroll_approach = ANY (ARRAY['recreational'::text, 'casual'::text, 'serious'::text, 'professional'::text]))),
    CONSTRAINT user_preferences_risk_tolerance_check CHECK ((risk_tolerance = ANY (ARRAY['conservative'::text, 'moderate'::text, 'aggressive'::text, 'degen'::text])))
);


--
-- Name: ai_recommendations ai_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id);


--
-- Name: app_state app_state_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_state
    ADD CONSTRAINT app_state_pkey PRIMARY KEY (id);


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);


--
-- Name: friendships friendships_user_id_friend_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user_id_friend_id_key UNIQUE (user_id, friend_id);


--
-- Name: games games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT games_pkey PRIMARY KEY (id);


--
-- Name: group_invites group_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites
    ADD CONSTRAINT group_invites_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id);


--
-- Name: group_picks group_picks_group_id_pick_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_picks
    ADD CONSTRAINT group_picks_group_id_pick_id_key UNIQUE (group_id, pick_id);


--
-- Name: group_picks group_picks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_picks
    ADD CONSTRAINT group_picks_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: matchup_history matchup_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matchup_history
    ADD CONSTRAINT matchup_history_pkey PRIMARY KEY (id);


--
-- Name: matchup_history matchup_history_team1_team2_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matchup_history
    ADD CONSTRAINT matchup_history_team1_team2_key UNIQUE (team1, team2);


--
-- Name: pick_groups pick_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pick_groups
    ADD CONSTRAINT pick_groups_pkey PRIMARY KEY (pick_id, group_id);


--
-- Name: picks picks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.picks
    ADD CONSTRAINT picks_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_phone_key UNIQUE (phone);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: stadium_distances stadium_distances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stadium_distances
    ADD CONSTRAINT stadium_distances_pkey PRIMARY KEY (id);


--
-- Name: stadium_distances stadium_distances_team1_team2_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stadium_distances
    ADD CONSTRAINT stadium_distances_team1_team2_key UNIQUE (team1, team2);


--
-- Name: team_situations team_situations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_situations
    ADD CONSTRAINT team_situations_pkey PRIMARY KEY (id);


--
-- Name: team_situations team_situations_team_week_season_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_situations
    ADD CONSTRAINT team_situations_team_week_season_key UNIQUE (team, week, season);


--
-- Name: picks unique_user_game; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.picks
    ADD CONSTRAINT unique_user_game UNIQUE (user_id, game_id);


--
-- Name: user_analytics user_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_analytics
    ADD CONSTRAINT user_analytics_pkey PRIMARY KEY (id);


--
-- Name: user_analytics user_analytics_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_analytics
    ADD CONSTRAINT user_analytics_user_id_key UNIQUE (user_id);


--
-- Name: user_game_views user_game_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_game_views
    ADD CONSTRAINT user_game_views_pkey PRIMARY KEY (id);


--
-- Name: user_game_views user_game_views_user_id_game_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_game_views
    ADD CONSTRAINT user_game_views_user_id_game_id_key UNIQUE (user_id, game_id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);


--
-- Name: idx_ai_recs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_recs_user ON public.ai_recommendations USING btree (user_id, created_at DESC);


--
-- Name: idx_games_context; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_games_context ON public.games USING btree (is_primetime, is_divisional, day_of_week);


--
-- Name: idx_games_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_games_week ON public.games USING btree (week, season);


--
-- Name: idx_group_members_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_role ON public.group_members USING btree (role);


--
-- Name: idx_group_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_members_user ON public.group_members USING btree (user_id);


--
-- Name: idx_groups_join_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_join_type ON public.groups USING btree (join_type);


--
-- Name: idx_groups_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_search ON public.groups USING btree (visibility, primary_sport, accuracy_rating DESC, created_at);


--
-- Name: idx_groups_sport; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_sport ON public.groups USING btree (sport, visibility);


--
-- Name: idx_groups_visibility; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_visibility ON public.groups USING btree (visibility);


--
-- Name: idx_matchup_history_teams; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matchup_history_teams ON public.matchup_history USING btree (team1, team2);


--
-- Name: idx_one_primary_owner_per_group; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_one_primary_owner_per_group ON public.group_members USING btree (group_id) WHERE (role = 'primary_owner'::text);


--
-- Name: idx_picks_analytics; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_picks_analytics ON public.picks USING btree (user_id, correct, game_is_primetime, game_is_divisional, picked_favorite);


--
-- Name: idx_picks_game_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_picks_game_id ON public.picks USING btree (game_id);


--
-- Name: idx_picks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_picks_user_id ON public.picks USING btree (user_id);


--
-- Name: idx_team_situations_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_situations_lookup ON public.team_situations USING btree (team, week, season);


--
-- Name: idx_team_situations_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_situations_week ON public.team_situations USING btree (week, season);


--
-- Name: idx_user_game_views_game; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_game_views_game ON public.user_game_views USING btree (game_id);


--
-- Name: idx_user_game_views_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_game_views_user ON public.user_game_views USING btree (user_id, week);


--
-- Name: ai_recommendations ai_recommendations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_recommendations ai_recommendations_user_pick_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_user_pick_id_fkey FOREIGN KEY (user_pick_id) REFERENCES public.picks(id);


--
-- Name: friendships friendships_friend_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: friendships friendships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: group_invites group_invites_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites
    ADD CONSTRAINT group_invites_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_invites group_invites_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_invites
    ADD CONSTRAINT group_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: group_picks group_picks_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_picks
    ADD CONSTRAINT group_picks_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_picks group_picks_pick_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_picks
    ADD CONSTRAINT group_picks_pick_id_fkey FOREIGN KEY (pick_id) REFERENCES public.picks(id) ON DELETE CASCADE;


--
-- Name: group_picks group_picks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_picks
    ADD CONSTRAINT group_picks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: groups groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: pick_groups pick_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pick_groups
    ADD CONSTRAINT pick_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: pick_groups pick_groups_pick_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pick_groups
    ADD CONSTRAINT pick_groups_pick_id_fkey FOREIGN KEY (pick_id) REFERENCES public.picks(id) ON DELETE CASCADE;


--
-- Name: picks picks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.picks
    ADD CONSTRAINT picks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);


--
-- Name: user_analytics user_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_analytics
    ADD CONSTRAINT user_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_game_views user_game_views_pick_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_game_views
    ADD CONSTRAINT user_game_views_pick_id_fkey FOREIGN KEY (pick_id) REFERENCES public.picks(id);


--
-- Name: user_game_views user_game_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_game_views
    ADD CONSTRAINT user_game_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: team_situations Admins can modify team situations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can modify team situations" ON public.team_situations USING (((auth.jwt() ->> 'role'::text) = 'admin'::text));


--
-- Name: profiles Anyone can view basic profile info; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view basic profile info" ON public.profiles FOR SELECT USING (true);


--
-- Name: groups Anyone can view group names; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view group names" ON public.groups FOR SELECT USING (true);


--
-- Name: matchup_history Anyone can view matchup history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view matchup history" ON public.matchup_history FOR SELECT USING (true);


--
-- Name: group_invites Anyone can view pending invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view pending invites" ON public.group_invites FOR SELECT USING ((status = 'pending'::text));


--
-- Name: team_situations Anyone can view team situations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view team situations" ON public.team_situations FOR SELECT USING (true);


--
-- Name: group_invites Authenticated users can create invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create invites" ON public.group_invites FOR INSERT TO authenticated WITH CHECK ((invited_by = auth.uid()));


--
-- Name: profiles Public profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_game_views Users can manage own game views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own game views" ON public.user_game_views USING ((auth.uid() = user_id));


--
-- Name: user_preferences Users can manage own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own preferences" ON public.user_preferences USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);


--
-- Name: group_invites Users can view invites they sent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view invites they sent" ON public.group_invites FOR SELECT TO authenticated USING ((invited_by = auth.uid()));


--
-- Name: user_analytics Users can view own analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own analytics" ON public.user_analytics FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ai_recommendations Users can view own recommendations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own recommendations" ON public.ai_recommendations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: group_invites Users can view their invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their invites" ON public.group_invites FOR SELECT USING ((invitee_email = (auth.jwt() ->> 'email'::text)));


--
-- Name: group_invites Users can view their own invites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own invites" ON public.group_invites FOR SELECT TO authenticated USING ((invitee_email = (auth.jwt() ->> 'email'::text)));


--
-- Name: ai_recommendations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

--
-- Name: group_invites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

--
-- Name: matchup_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.matchup_history ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: team_situations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_situations ENABLE ROW LEVEL SECURITY;

--
-- Name: user_analytics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: user_game_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_game_views ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION populate_pick_context(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.populate_pick_context() TO anon;
GRANT ALL ON FUNCTION public.populate_pick_context() TO authenticated;
GRANT ALL ON FUNCTION public.populate_pick_context() TO service_role;


--
-- Name: TABLE ai_recommendations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ai_recommendations TO anon;
GRANT ALL ON TABLE public.ai_recommendations TO authenticated;
GRANT ALL ON TABLE public.ai_recommendations TO service_role;


--
-- Name: TABLE app_state; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.app_state TO anon;
GRANT ALL ON TABLE public.app_state TO authenticated;
GRANT ALL ON TABLE public.app_state TO service_role;


--
-- Name: TABLE friendships; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.friendships TO anon;
GRANT ALL ON TABLE public.friendships TO authenticated;
GRANT ALL ON TABLE public.friendships TO service_role;


--
-- Name: TABLE games; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.games TO anon;
GRANT ALL ON TABLE public.games TO authenticated;
GRANT ALL ON TABLE public.games TO service_role;


--
-- Name: TABLE group_invites; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.group_invites TO anon;
GRANT ALL ON TABLE public.group_invites TO authenticated;
GRANT ALL ON TABLE public.group_invites TO service_role;


--
-- Name: TABLE group_members; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.group_members TO anon;
GRANT ALL ON TABLE public.group_members TO authenticated;
GRANT ALL ON TABLE public.group_members TO service_role;


--
-- Name: TABLE group_picks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.group_picks TO anon;
GRANT ALL ON TABLE public.group_picks TO authenticated;
GRANT ALL ON TABLE public.group_picks TO service_role;


--
-- Name: TABLE groups; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.groups TO anon;
GRANT ALL ON TABLE public.groups TO authenticated;
GRANT ALL ON TABLE public.groups TO service_role;


--
-- Name: TABLE matchup_history; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.matchup_history TO anon;
GRANT ALL ON TABLE public.matchup_history TO authenticated;
GRANT ALL ON TABLE public.matchup_history TO service_role;


--
-- Name: TABLE pick_groups; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pick_groups TO anon;
GRANT ALL ON TABLE public.pick_groups TO authenticated;
GRANT ALL ON TABLE public.pick_groups TO service_role;


--
-- Name: TABLE picks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.picks TO anon;
GRANT ALL ON TABLE public.picks TO authenticated;
GRANT ALL ON TABLE public.picks TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE stadium_distances; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.stadium_distances TO anon;
GRANT ALL ON TABLE public.stadium_distances TO authenticated;
GRANT ALL ON TABLE public.stadium_distances TO service_role;


--
-- Name: TABLE team_situations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.team_situations TO anon;
GRANT ALL ON TABLE public.team_situations TO authenticated;
GRANT ALL ON TABLE public.team_situations TO service_role;


--
-- Name: TABLE user_analytics; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_analytics TO anon;
GRANT ALL ON TABLE public.user_analytics TO authenticated;
GRANT ALL ON TABLE public.user_analytics TO service_role;


--
-- Name: TABLE user_game_views; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_game_views TO anon;
GRANT ALL ON TABLE public.user_game_views TO authenticated;
GRANT ALL ON TABLE public.user_game_views TO service_role;


--
-- Name: TABLE user_preferences; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.user_preferences TO anon;
GRANT ALL ON TABLE public.user_preferences TO authenticated;
GRANT ALL ON TABLE public.user_preferences TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict 4c6BGVawb7cUeTKepckT1QcxqpVcmzHFkCi3ExLe6wRTzTKXghAaNNxwp7vRJfM

