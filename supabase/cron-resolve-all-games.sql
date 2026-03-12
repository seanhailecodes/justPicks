-- =============================================================
-- BetLess — Game Resolve Cron Jobs
-- Run this in the Supabase SQL Editor after deploying resolve functions.
--
--   https://supabase.com/dashboard/project/oyedfzsqqqdfrmhbcbwb/sql/new
--
-- You need your Service Role key — find it at:
--   Project Settings → API → service_role (secret) key
--
-- All times are UTC. Based on EST (UTC-5).
-- Resolve jobs run 5× daily at times when games have typically finished.
--
-- Schedule summary (ET → UTC):
--   2:00 AM ET  → 07:00 UTC  (catches late night games from prior day)
--   8:00 AM ET  → 13:00 UTC  (morning sweep)
--   12:00 PM ET → 17:00 UTC  (afternoon sweep)
--   6:00 PM ET  → 23:00 UTC  (evening sweep, catches afternoon games)
--  11:00 PM ET  → 04:00 UTC  (late night sweep, catches evening games)
--
-- Each cron invokes the resolve function for sports that may have
-- finished around that time of day.
-- =============================================================

-- Step 1: Remove any old resolve jobs
SELECT cron.unschedule('resolve-nba-games') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'resolve-nba-games');
SELECT cron.unschedule('resolve-nhl-games') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'resolve-nhl-games');
SELECT cron.unschedule('resolve-ncaab-games') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'resolve-ncaab-games');
SELECT cron.unschedule('resolve-nfl-games') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'resolve-nfl-games');
SELECT cron.unschedule('resolve-soccer-games') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'resolve-soccer-games');
SELECT cron.unschedule('resolve-all-games-sweep');

-- Step 2: NBA + NHL — run 5× daily (games run afternoon through midnight)
SELECT cron.schedule(
  'resolve-nba-games',
  '0 4,7,13,17,23 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/resolve-nba-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'resolve-nhl-games',
  '0 4,7,13,17,23 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/resolve-nhl-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Step 3: NCAAB — 3× daily (college games mostly afternoons + evenings)
SELECT cron.schedule(
  'resolve-ncaab-games',
  '0 4,13,23 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/resolve-ncaab-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Step 4: NFL — 3× daily on Sun/Mon/Thu (game days), daily otherwise as safety net
SELECT cron.schedule(
  'resolve-nfl-games',
  '0 4,13,23 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/resolve-nfl-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Step 5: Soccer — 3× daily (international kick-offs vary widely)
SELECT cron.schedule(
  'resolve-soccer-games',
  '0 4,13,23 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/resolve-soccer-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Verify all resolve jobs are scheduled:
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'resolve-nba-games',
  'resolve-nhl-games',
  'resolve-ncaab-games',
  'resolve-nfl-games',
  'resolve-soccer-games'
)
ORDER BY jobname;
