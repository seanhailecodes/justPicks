-- =============================================================
-- Enable Row Level Security on public tables flagged by the
-- Supabase Security Advisor (rls_disabled_in_public).
--
-- IMPORTANT: paste this whole file into the Supabase SQL Editor and
-- run it once. It is idempotent (uses IF NOT EXISTS for policies via
-- DROP+CREATE) so re-running is safe.
--
-- Strategy: enable RLS on every flagged table, then add policies
-- that match how the app currently reads/writes each one. The goal
-- is to eliminate anonymous read/write on tables holding user data
-- while keeping the app working end-to-end.
--
-- Note: edge functions use the service_role key, which bypasses RLS
-- entirely, so cron jobs / fetch / resolve functions keep working
-- without any policy entries.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- picks — user betting picks. Most sensitive table here.
-- -------------------------------------------------------------
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "picks: authenticated read"   ON public.picks;
DROP POLICY IF EXISTS "picks: owner write insert"   ON public.picks;
DROP POLICY IF EXISTS "picks: owner write update"   ON public.picks;
DROP POLICY IF EXISTS "picks: owner write delete"   ON public.picks;

-- Any logged-in user can read picks (group leaderboard, share, ratings).
-- Anonymous users get nothing. (Tighten further later if you want
-- pick visibility restricted to friends/group members only.)
CREATE POLICY "picks: authenticated read"
  ON public.picks FOR SELECT
  TO authenticated
  USING (true);

-- Only the owner can create/modify/delete their own picks.
CREATE POLICY "picks: owner write insert"
  ON public.picks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "picks: owner write update"
  ON public.picks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "picks: owner write delete"
  ON public.picks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- -------------------------------------------------------------
-- games — public sports data. Anyone (anon + authenticated) can
-- read; only the service_role (cron/edge functions) can write.
-- -------------------------------------------------------------
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "games: public read" ON public.games;

CREATE POLICY "games: public read"
  ON public.games FOR SELECT
  TO anon, authenticated
  USING (true);
-- No INSERT/UPDATE/DELETE policies → only service_role can write.


-- -------------------------------------------------------------
-- groups — visibility-aware reads, owner-controlled writes.
-- -------------------------------------------------------------
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups: public visible or member"  ON public.groups;
DROP POLICY IF EXISTS "groups: any auth can create"       ON public.groups;
DROP POLICY IF EXISTS "groups: creator can update"        ON public.groups;
DROP POLICY IF EXISTS "groups: creator can delete"        ON public.groups;

CREATE POLICY "groups: public visible or member"
  ON public.groups FOR SELECT
  TO authenticated
  USING (
    visibility = 'public'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "groups: any auth can create"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "groups: creator can update"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "groups: creator can delete"
  ON public.groups FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());


-- -------------------------------------------------------------
-- group_members — visible to other members; self-join/leave.
-- -------------------------------------------------------------
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_members: members read"   ON public.group_members;
DROP POLICY IF EXISTS "group_members: self join"      ON public.group_members;
DROP POLICY IF EXISTS "group_members: self leave"     ON public.group_members;
DROP POLICY IF EXISTS "group_members: owner manage"   ON public.group_members;

CREATE POLICY "group_members: members read"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm2
      WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id AND g.visibility = 'public'
    )
  );

CREATE POLICY "group_members: self join"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "group_members: self leave"
  ON public.group_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "group_members: owner manage"
  ON public.group_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm3
      WHERE gm3.group_id = group_members.group_id
        AND gm3.user_id = auth.uid()
        AND gm3.role IN ('primary_owner', 'owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm3
      WHERE gm3.group_id = group_members.group_id
        AND gm3.user_id = auth.uid()
        AND gm3.role IN ('primary_owner', 'owner', 'admin')
    )
  );


-- -------------------------------------------------------------
-- group_picks — picks shared to a group. Visible to group members;
-- the pick owner controls sharing.
-- -------------------------------------------------------------
ALTER TABLE public.group_picks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_picks: members read"      ON public.group_picks;
DROP POLICY IF EXISTS "group_picks: owner shares"      ON public.group_picks;
DROP POLICY IF EXISTS "group_picks: owner unshares"    ON public.group_picks;

CREATE POLICY "group_picks: members read"
  ON public.group_picks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_picks.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "group_picks: owner shares"
  ON public.group_picks FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_picks.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "group_picks: owner unshares"
  ON public.group_picks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- -------------------------------------------------------------
-- pick_groups — legacy/alternate join table (pick_id, group_id).
-- No user_id column, so policies derive ownership from picks.
-- -------------------------------------------------------------
ALTER TABLE public.pick_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pick_groups: members read"    ON public.pick_groups;
DROP POLICY IF EXISTS "pick_groups: owner shares"    ON public.pick_groups;
DROP POLICY IF EXISTS "pick_groups: owner unshares"  ON public.pick_groups;

CREATE POLICY "pick_groups: members read"
  ON public.pick_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = pick_groups.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "pick_groups: owner shares"
  ON public.pick_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.picks p
      WHERE p.id = pick_groups.pick_id AND p.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = pick_groups.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "pick_groups: owner unshares"
  ON public.pick_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.picks p
      WHERE p.id = pick_groups.pick_id AND p.user_id = auth.uid()
    )
  );


-- -------------------------------------------------------------
-- friendships — readable / writable by either involved party.
-- -------------------------------------------------------------
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friendships: involved read"    ON public.friendships;
DROP POLICY IF EXISTS "friendships: self insert"      ON public.friendships;
DROP POLICY IF EXISTS "friendships: involved update"  ON public.friendships;
DROP POLICY IF EXISTS "friendships: involved delete"  ON public.friendships;

CREATE POLICY "friendships: involved read"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships: self insert"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "friendships: involved update"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "friendships: involved delete"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());


-- -------------------------------------------------------------
-- app_state — internal cron state. Read-only public; writes via
-- service_role only.
-- -------------------------------------------------------------
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_state: public read" ON public.app_state;

CREATE POLICY "app_state: public read"
  ON public.app_state FOR SELECT
  TO anon, authenticated
  USING (true);


-- -------------------------------------------------------------
-- stadium_distances — static reference data. Read-only public.
-- -------------------------------------------------------------
ALTER TABLE public.stadium_distances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stadium_distances: public read" ON public.stadium_distances;

CREATE POLICY "stadium_distances: public read"
  ON public.stadium_distances FOR SELECT
  TO anon, authenticated
  USING (true);


COMMIT;


-- =============================================================
-- Verify: list every public table and whether RLS is enabled.
-- All should show rls = true after the migration runs.
-- =============================================================
SELECT schemaname, tablename, rowsecurity AS rls
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls, tablename;
