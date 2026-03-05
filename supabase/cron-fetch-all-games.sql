-- =============================================================
-- justPicks — Game Fetch Cron Jobs
-- Run this in the Supabase SQL Editor to replace the old
-- every-4-hours job with sport-specific optimised schedules.
--
--   https://supabase.com/dashboard/project/oyedfzsqqqdfrmhbcbwb/sql/new
--
-- You need your Service Role key — find it at:
--   Project Settings → API → service_role (secret) key
--
-- All times are UTC. ET offsets used below are EST (UTC-5).
-- If running during EDT (summer, UTC-4), adjust each hour -1.
--
-- Schedule summary:
--   NBA:             Daily 7:30am ET  → 12:30 UTC  +  2:00pm ET → 19:00 UTC
--   NCAAB + NHL:     Daily 10:00am ET → 15:00 UTC
--   Soccer/Golf/UFC: Mon + Sat 10:00am ET → 15:00 UTC
--
-- In-season filtering is handled inside fetch-all-games —
-- out-of-season sports are automatically skipped even if the cron fires.
-- =============================================================

-- Step 1: Remove the old every-4-hours job
SELECT cron.unschedule('fetch-all-games');

-- Step 2: NBA — 7:30am ET daily (12:30 UTC)
SELECT cron.schedule(
  'fetch-nba-morning',
  '30 12 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/fetch-all-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{"sports":["NBA"]}'::jsonb
  );
  $$
);

-- Step 3: NBA — 2:00pm ET daily (19:00 UTC)
SELECT cron.schedule(
  'fetch-nba-afternoon',
  '0 19 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/fetch-all-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{"sports":["NBA"]}'::jsonb
  );
  $$
);

-- Step 4: NCAAB + NHL — 10:00am ET daily (15:00 UTC)
SELECT cron.schedule(
  'fetch-ncaab-nhl-daily',
  '0 15 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/fetch-all-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{"sports":["NCAAB","NHL"]}'::jsonb
  );
  $$
);

-- Step 5: Soccer, Golf, UFC — Mon + Sat 10:00am ET (15:00 UTC)
SELECT cron.schedule(
  'fetch-other-sports-mon-sat',
  '0 15 * * 1,6',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/fetch-all-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{"sports":["Soccer","Golf","UFC"]}'::jsonb
  );
  $$
);

-- Verify all jobs are scheduled:
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('resolve-all-games', 'fetch-nba-morning', 'fetch-nba-afternoon', 'fetch-ncaab-nhl-daily', 'fetch-other-sports-mon-sat')
ORDER BY jobname;
