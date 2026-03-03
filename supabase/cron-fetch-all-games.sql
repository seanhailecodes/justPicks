-- ============================================================
-- Auto-fetch all sport games every 4 hours via pg_cron
--
-- Run this once in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/oyedfzsqqqdfrmhbcbwb/sql/new
--
-- You need your Service Role key — find it at:
--   Project Settings → API → service_role (secret) key
-- ============================================================

-- Step 1: Remove the old job if it exists (safe to re-run)
SELECT cron.unschedule('fetch-all-games') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'fetch-all-games'
);

-- Step 2: Schedule the new job — runs at minute 0 of every 4th hour (UTC)
--         i.e. 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
SELECT cron.schedule(
  'fetch-all-games',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/fetch-all-games',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <PASTE_YOUR_SERVICE_ROLE_KEY_HERE>'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- Verify both cron jobs are registered
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('fetch-all-games', 'resolve-all-games')
ORDER BY jobname;
