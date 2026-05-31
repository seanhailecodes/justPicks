-- Allow WNBA groups. The groups.sport / primary_sport CHECK constraints
-- enumerated sports and didn't include 'wnba', so creating a WNBA group failed.
ALTER TABLE public.groups DROP CONSTRAINT groups_sport_check;
ALTER TABLE public.groups ADD CONSTRAINT groups_sport_check
  CHECK (sport = ANY (ARRAY['nfl','nba','wnba','mlb','nhl','ncaab','soccer','ufc','boxing','pga']));

ALTER TABLE public.groups DROP CONSTRAINT groups_primary_sport_check;
ALTER TABLE public.groups ADD CONSTRAINT groups_primary_sport_check
  CHECK (primary_sport = ANY (ARRAY['nfl','nba','wnba','mlb','nhl','ncaab','soccer','ufc','boxing','pga','multi']));
