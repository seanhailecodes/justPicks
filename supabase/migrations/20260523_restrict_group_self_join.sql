-- =============================================================
-- Stop free self-joins into non-open groups.
--
-- The group_members "self join" INSERT policy only checked
-- user_id = auth.uid() — so any authenticated user could insert
-- themselves into ANY group, including invite-only / private ones.
--
-- New rule: a user may self-join only when the group's join_type
-- is 'open', OR the group currently has a pending invite (how the
-- accept-invite flow legitimately adds a member). request_to_join
-- groups are joined by an owner/admin via the "owner manage"
-- policy; the auto-enroll trigger is SECURITY DEFINER and bypasses
-- RLS, so official public groups are unaffected.
--
-- Helper functions are SECURITY DEFINER (bypass RLS on the inner
-- read — consistent with 20260523_fix_rls_recursion_group_policies).
--
-- Idempotent. Paste into the Supabase SQL Editor, run once.
-- =============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.is_group_open(_group_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND join_type = 'open'
  );
$$;

CREATE OR REPLACE FUNCTION public.group_has_pending_invite(_group_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_invites
    WHERE group_id = _group_id
      AND status = 'pending'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_group_open(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.group_has_pending_invite(uuid) TO authenticated;

DROP POLICY IF EXISTS "group_members: self join" ON public.group_members;

CREATE POLICY "group_members: self join"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.is_group_open(group_id)
      OR public.group_has_pending_invite(group_id)
    )
  );

COMMIT;


-- =============================================================
-- Verify: the recreated self-join policy's WITH CHECK should now
-- gate on is_group_open / group_has_pending_invite.
-- =============================================================
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'group_members'
  AND policyname = 'group_members: self join';
