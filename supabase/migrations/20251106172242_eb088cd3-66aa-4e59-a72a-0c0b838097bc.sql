-- Add policy for invited users to view basic project info
CREATE POLICY "Invited users can view project basic info"
  ON projects
  FOR SELECT
  USING (
    id IN (
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