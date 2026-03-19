-- Allow unauthenticated users to read pending invites by ID.
-- Required for the /accept-invite/[id] page which loads before the user logs in.
CREATE POLICY "Public can view pending invites"
ON group_invites
FOR SELECT
TO anon, authenticated
USING (status = 'pending');
