-- =============================================================
-- FIX: infinite recursion in group-related RLS policies.
--
-- The 20260520 migration added policies whose USING / WITH CHECK
-- clauses queried group_members from inside a policy ON
-- group_members (and groups -> group_members -> group_members).
-- Postgres re-applies a table's RLS policy to every subquery
-- against that same table, so this produced:
--   ERROR: infinite recursion detected in policy for relation
--          "group_members"
-- and EVERY read of groups / group_members / group_picks /
-- pick_groups failed -- groups silently disappeared in the app.
--
-- FIX: move the membership / role / visibility checks into
-- SECURITY DEFINER helper functions. A SECURITY DEFINER function
-- executes as its owner (postgres) and is NOT subject to the
-- caller's RLS, so the inner lookups no longer re-trigger the
-- policy and the recursion cycle is broken.
--
-- Idempotent: CREATE OR REPLACE + DROP POLICY IF EXISTS.
-- Paste this whole file into the Supabase SQL Editor, run once.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- 1. Helper functions. SECURITY DEFINER bypasses RLS on the
--    inner reads -- that is what breaks the recursion cycle.
--    SET search_path pins name resolution (also satisfies the
--    Supabase advisor's function_search_path_mutable check).
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id
      AND user_id = _user_id
      AND role IN ('primary_owner', 'owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_public(_group_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND visibility = 'public'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid)  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_group_public(uuid)       TO authenticated, anon;


-- -------------------------------------------------------------
-- 2. groups -- replace the member-check subquery with the function.
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "groups: public visible or member" ON public.groups;

CREATE POLICY "groups: public visible or member"
  ON public.groups FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    OR created_by = auth.uid()
    OR public.is_group_member(id, auth.uid())
  );


-- -------------------------------------------------------------
-- 3. group_members -- the self-referential policies. This is the
--    table that actually triggered the recursion.
--    ("self join" INSERT and "self leave" DELETE from the
--    20260520 migration are left untouched -- they only test
--    user_id = auth.uid() and never recurse.)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "group_members: members read" ON public.group_members;
DROP POLICY IF EXISTS "group_members: owner manage" ON public.group_members;

CREATE POLICY "group_members: members read"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_group_member(group_id, auth.uid())
    OR public.is_group_public(group_id)
  );

CREATE POLICY "group_members: owner manage"
  ON public.group_members FOR ALL
  TO authenticated
  USING (public.is_group_admin(group_id, auth.uid()))
  WITH CHECK (public.is_group_admin(group_id, auth.uid()));


-- -------------------------------------------------------------
-- 4. group_picks -- member read + owner share used the same
--    recursive group_members subquery.
--    ("owner unshares" DELETE is unaffected -- user_id only.)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "group_picks: members read" ON public.group_picks;
DROP POLICY IF EXISTS "group_picks: owner shares" ON public.group_picks;

CREATE POLICY "group_picks: members read"
  ON public.group_picks FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "group_picks: owner shares"
  ON public.group_picks FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_group_member(group_id, auth.uid())
  );


-- -------------------------------------------------------------
-- 5. pick_groups -- same group_members subquery in read + share.
--    ("owner unshares" DELETE is unaffected -- the picks subquery
--    is non-recursive.)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "pick_groups: members read" ON public.pick_groups;
DROP POLICY IF EXISTS "pick_groups: owner shares" ON public.pick_groups;

CREATE POLICY "pick_groups: members read"
  ON public.pick_groups FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "pick_groups: owner shares"
  ON public.pick_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.picks p
      WHERE p.id = pick_groups.pick_id AND p.user_id = auth.uid()
    )
    AND public.is_group_member(group_id, auth.uid())
  );


COMMIT;


-- =============================================================
-- Verify: all 14 recreated/retained policies should be listed.
-- =============================================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'group_members', 'group_picks', 'pick_groups')
ORDER BY tablename, policyname;
