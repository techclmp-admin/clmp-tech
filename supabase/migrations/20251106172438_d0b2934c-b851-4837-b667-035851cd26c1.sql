-- Add policy to allow invited users to join projects
CREATE POLICY "Invited users can join projects"
  ON project_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND project_id IN (
      SELECT project_id
      FROM team_invitations
      WHERE email IN (
        SELECT email 
        FROM profiles 
        WHERE id = auth.uid()
      )
      AND status = 'pending'
      AND expires_at > now()
    )
  );