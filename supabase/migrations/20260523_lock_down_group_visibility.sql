-- =============================================================
-- Lock down public.groups visibility (private groups stay private).
--
-- The legacy policy "Anyone can view group names" was:
--     FOR SELECT USING (true)      -- no role restriction
-- which exposed EVERY groups row (names, descriptions, member
-- counts, invite codes) to everyone, including logged-out users.
-- Because permissive policies are OR'd together, it overrode the
-- visibility-aware policy from 20260520 -- so private groups were
-- never actually private.
--
-- This migration:
--   1. Drops that blanket policy. Group reads then fall through
--      to "groups: public visible or member" (20260520):
--      authenticated users see public groups + groups they
--      created or belong to; anonymous users see none.
--   2. Adds two SECURITY DEFINER lookup functions so the invite
--      flows still work without re-exposing the whole table:
--        - get_group_name_for_invite(invite_id) -> accept-invite
--        - get_group_by_invite_code(code)        -> join-by-code
--      Each returns exactly one group, only via a valid invite or
--      code, and bypasses RLS safely under definer rights.
--
-- Paired with app changes in:
--   app/accept-invite/[inviteId].tsx
--   app/join/[code].tsx
--
-- Idempotent. Paste into the Supabase SQL Editor, run once.
-- =============================================================

BEGIN;

-- 1. Remove the blanket "everyone sees every group" policy.
DROP POLICY IF EXISTS "Anyone can view group names" ON public.groups;

-- 2a. accept-invite: resolve a group's display name from a pending
--     invite id. Returns NULL if the invite is missing / not pending.
CREATE OR REPLACE FUNCTION public.get_group_name_for_invite(_invite_id uuid)
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT g.name
  FROM public.group_invites gi
  JOIN public.groups g ON g.id = gi.group_id
  WHERE gi.id = _invite_id
    AND gi.status = 'pending';
$$;

-- 2b. join-by-code: resolve a single group from its invite code.
--     Returns no rows for an unknown code.
CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(_code text)
  RETURNS TABLE (id uuid, name text, created_by uuid)
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT g.id, g.name, g.created_by
  FROM public.groups g
  WHERE g.invite_code = upper(_code);
$$;

GRANT EXECUTE ON FUNCTION public.get_group_name_for_invite(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_by_invite_code(text)  TO anon, authenticated;

COMMIT;


-- =============================================================
-- Verify: groups should now have ONE SELECT policy
-- ("groups: public visible or member") plus the create / update /
-- delete policies -- the blanket "Anyone can view group names"
-- row should be gone.
-- =============================================================
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'groups'
ORDER BY cmd, policyname;
