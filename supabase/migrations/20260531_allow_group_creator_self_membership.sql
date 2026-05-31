-- Group creation inserts the group, then inserts the creator into group_members
-- as primary_owner. The "self join" RLS policy only allowed self-inserts when the
-- group was 'open' or the user had a pending invite — both false at creation for
-- invite_only/request_to_join groups — so creating any non-open group failed on
-- the group_members insert. Allow the creator to seed their own membership.
CREATE OR REPLACE FUNCTION public.is_group_creator(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.groups WHERE id = _group_id AND created_by = _user_id);
$$;
GRANT EXECUTE ON FUNCTION public.is_group_creator(uuid, uuid) TO anon, authenticated;

DROP POLICY "group_members: self join" ON public.group_members;
CREATE POLICY "group_members: self join" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid())
    AND (
      is_group_open(group_id)
      OR group_has_pending_invite(group_id)
      OR is_group_creator(group_id, auth.uid())
    )
  );
