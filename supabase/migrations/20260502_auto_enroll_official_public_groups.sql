-- Auto-enroll new signups into all 9 official public groups (one per sport).
--
-- This file is queued — not applied to prod yet. Apply manually via the
-- Supabase SQL editor when batching with other fixes.
--
-- Prerequisites (already done in step 2):
--   - groups.is_official boolean column exists
--   - 9 rows in groups have is_official = true (one per sport)
--
-- What this migration does:
--   1. Defines a function that adds membership rows for every official
--      public group when a new auth user is created.
--   2. Wires it as an AFTER INSERT trigger on auth.users.
--   3. Backfills existing users into all official groups they're not yet in.
--
-- Idempotency: ON CONFLICT DO NOTHING means re-running this script is safe.

-- ---------------------------------------------------------------------------
-- 1. Trigger function
-- ---------------------------------------------------------------------------
create or replace function public.enroll_in_official_public_groups()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (user_id, group_id)
  select new.id, g.id
  from public.groups g
  where g.is_official = true
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

comment on function public.enroll_in_official_public_groups()
  is 'Adds the new auth user to every group flagged is_official = true.';

-- ---------------------------------------------------------------------------
-- 2. Trigger
-- ---------------------------------------------------------------------------
drop trigger if exists trg_enroll_in_official_public_groups on auth.users;

create trigger trg_enroll_in_official_public_groups
  after insert on auth.users
  for each row
  execute function public.enroll_in_official_public_groups();

-- ---------------------------------------------------------------------------
-- 3. One-time backfill for existing users
-- ---------------------------------------------------------------------------
-- Adds (user, group) memberships for every (existing_user × official_group)
-- pair that doesn't already exist. Safe to run alongside the trigger.
insert into public.group_members (user_id, group_id)
select u.id, g.id
from auth.users u
cross join public.groups g
where g.is_official = true
on conflict (group_id, user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Verify (read-only — safe to re-run)
-- ---------------------------------------------------------------------------
-- Expected: roughly (active_user_count × 9) memberships in official groups.
-- Run after applying:
--
--   select g.sport, g.name, count(gm.user_id) as members
--   from public.groups g
--   left join public.group_members gm on gm.group_id = g.id
--   where g.is_official = true
--   group by g.sport, g.name
--   order by g.sport;
