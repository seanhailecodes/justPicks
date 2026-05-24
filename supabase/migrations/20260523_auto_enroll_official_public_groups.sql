-- =============================================================
-- Auto-enroll every user into all 9 official public groups
-- (one per sport: NFL, NBA, NCAAB, Soccer, NHL, MLB, UFC,
-- Boxing, Golf).
--
-- Supersedes the queued 20260502 migration, which triggered on
-- auth.users. That was unsafe: group_members.user_id has a
-- FOREIGN KEY to public.profiles(id) -- not auth.users(id). A
-- trigger on auth.users can fire before the profile row exists
-- and fail the FK. This version triggers on public.profiles, so
-- the referenced row is guaranteed to exist.
--
-- What it does:
--   1. (Re)defines a SECURITY DEFINER function that inserts a
--      membership row for every is_official = true group.
--   2. Fires it AFTER INSERT ON public.profiles.
--   3. Backfills every existing profile into every official group.
--
-- Idempotent: ON CONFLICT DO NOTHING + CREATE OR REPLACE +
-- DROP TRIGGER IF EXISTS. Safe to re-run.
-- Paste into the Supabase SQL Editor, run once.
-- =============================================================

BEGIN;

-- 1. Enrollment function. SECURITY DEFINER so it can write
--    group_members regardless of the caller's RLS.
CREATE OR REPLACE FUNCTION public.enroll_in_official_public_groups()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (user_id, group_id)
  SELECT NEW.id, g.id
  FROM public.groups g
  WHERE g.is_official = true
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enroll_in_official_public_groups()
  IS 'Adds a newly created profile to every group flagged is_official = true.';

-- 2. Trigger on profiles (the table group_members.user_id FKs to).
--    Also drop any stale copy on auth.users from the 20260502 draft.
DROP TRIGGER IF EXISTS trg_enroll_in_official_public_groups ON auth.users;
DROP TRIGGER IF EXISTS trg_enroll_in_official_public_groups ON public.profiles;

CREATE TRIGGER trg_enroll_in_official_public_groups
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enroll_in_official_public_groups();

-- 3. One-time backfill: every existing profile into every
--    official group it is not already a member of.
INSERT INTO public.group_members (user_id, group_id)
SELECT p.id, g.id
FROM public.profiles p
CROSS JOIN public.groups g
WHERE g.is_official = true
ON CONFLICT (group_id, user_id) DO NOTHING;

COMMIT;


-- =============================================================
-- Verify: member count per official group -- each row should
-- equal the total number of profiles.
-- =============================================================
SELECT g.sport, g.name, count(gm.user_id) AS members
FROM public.groups g
LEFT JOIN public.group_members gm ON gm.group_id = g.id
WHERE g.is_official = true
GROUP BY g.sport, g.name
ORDER BY g.sport;
