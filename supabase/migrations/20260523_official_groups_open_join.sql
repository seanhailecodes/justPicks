-- =============================================================
-- Official public groups should all be openly joinable.
--
-- Two official groups (PublicNBAGroup, CollegeHoopsFans) were left
-- with join_type = 'invite_only', so they rendered a "Invite Only"
-- state and couldn't be joined. Official public groups are meant
-- to be open (every user is auto-enrolled into them). This sets
-- every is_official group to join_type = 'open'.
--
-- Idempotent. Paste into the Supabase SQL Editor, run once.
-- =============================================================

UPDATE public.groups
SET join_type = 'open'
WHERE is_official = true AND join_type <> 'open';

-- Verify: every official group should now be 'open'.
SELECT name, sport, join_type, is_official
FROM public.groups
WHERE is_official = true
ORDER BY sport;
