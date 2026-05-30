-- Security hardening (Supabase advisor remediation)
-- Applied 2026-05-30.

-- 1. Pin search_path on functions flagged as mutable (prevents search_path
--    injection). All three reference only schema-qualified public objects or
--    built-ins, so 'public' is safe.
ALTER FUNCTION public.handle_new_user() SET search_path TO 'public';
ALTER FUNCTION public.populate_pick_context() SET search_path TO 'public';
ALTER FUNCTION public.advance_nfl_week() SET search_path TO 'public';

-- 2. Remove trigger-only SECURITY DEFINER functions from the public REST/RPC
--    surface. Both are triggers (on auth.users / profiles); triggers fire
--    regardless of the invoking role's EXECUTE grant, so signup and official-
--    group enrollment are unaffected.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enroll_in_official_public_groups() FROM anon, authenticated, public;

-- 3. Tighten feedback INSERT. Was WITH CHECK (true) for the public role, letting
--    any anon-key holder write arbitrary rows. Require a signed-in user writing
--    their own id (matches the FeedbackModal payload: user_id = auth user id).
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Authenticated users can insert their own feedback"
  ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- NOTE (intentionally not changed): the is_group_* and group_has_pending_invite
-- SECURITY DEFINER helpers remain executable by anon/authenticated because they
-- are referenced inside RLS policies on groups/group_members/group_picks/
-- pick_groups; revoking EXECUTE would break those policies. To also hide them
-- from the REST API, move them to a private (non-exposed) schema and update the
-- policy references — deferred as a larger change.
