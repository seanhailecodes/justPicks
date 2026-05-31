-- The groups INSERT policy only checks created_by = auth.uid(), so a user with
-- the public anon key could POST a group with is_official = true (and get new
-- signups auto-enrolled via enroll_in_official_public_groups). Force is_official
-- to false for non-privileged roles on insert/update; only service_role / the
-- dashboard can create or flag Official groups.
CREATE OR REPLACE FUNCTION public.enforce_official_group_admin_only()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE(NEW.is_official, false)
     AND current_user NOT IN ('service_role', 'supabase_admin', 'postgres') THEN
    NEW.is_official := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_official_group ON public.groups;
CREATE TRIGGER trg_enforce_official_group
  BEFORE INSERT OR UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.enforce_official_group_admin_only();
