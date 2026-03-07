-- =============================================================
-- BetLess — Game Fetch Cron Jobs
-- Run this in the Supabase SQL Editor to replace all old jobs.
--
--   https://supabase.com/dashboard/project/oyedfzsqqqdfrmhbcbwb/sql/new
--
-- You need your Service Role key — find it at:
--   Project Settings → API → service_role (secret) key
--
-- All times are UTC. Based on EST (UTC-5).
-- If running during EDT (summer, UTC-4), adjust each hour -1.
--
-- Schedule summary:
--   NBA + NHL + MLB:  Daily 7× — midnight, 3am, 6am, 10am, noon, 5pm, 8pm ET
--                     → 05:00, 08:00, 11:00, 15:00, 17:00, 22:00, 01:00 UTC
--   NCAAB:            Daily once — 10:00am ET → 15:00 UTC
--   Soccer/Golf/UFC:  Mon + Sat — 10:00am ET → 15:00 UTC
--
-- In-season filtering is handled inside fetch-all-games —
-- out-of-season sports are automatically skipped even if the cron fires.
-- =============================================================

-- Step 1: Remove old jobs (ignore errors if they don't exist)
SELECT cron.unschedule('fetch-all-games');
SELECT cron.unschedule('fetch-nba-morning');
SELECT cron.unschedule('fetch-nba-afternoon');
SELECT cron.unschedule('fetch-ncaab-nhl-daily');
SELECT cron.unschedule('fetch-other-sports-mon-sat');
SELECT cron.unschedule('fetch-active-sports-daily');

-- Step 2: NBA + NHL + MLB — 6× daily at midnight, 3am, 6am, 10am, noon, 5pm ET
--         (01:00 UTC handles the 8pm ET slot — see Step 3)
SELECT cron.schedule(
  'fetch-active-sports-6x-daily',
  '0 5,8,11,15,17,22 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/fetch-all-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{"sports":["NBA","NHL","MLB"]}'::jsonb
  );
  $$
);

-- Step 3: NBA + NHL + MLB — 8pm ET (01:00 UTC next day)
SELECT cron.schedule(
  'fetch-active-sports-8pm-et',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/fetch-all-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{"sports":["NBA","NHL","MLB"]}'::jsonb
  );
  $$
);

-- Step 4: NCAAB — once daily at 10:00am ET (15:00 UTC)
SELECT cron.schedule(
  'fetch-ncaab-daily',
  '0 15 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/fetch-all-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{"sports":["NCAAB"]}'::jsonb
  );
  $$
);

-- Step 5: Soccer, Golf, UFC — Mon + Sat at 10:00am ET (15:00 UTC)
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
WHERE jobname IN (
  'fetch-active-sports-6x-daily',
  'fetch-active-sports-8pm-et',
  'fetch-ncaab-daily',
  'fetch-other-sports-mon-sat'
)
ORDER BY jobname;
