-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON team_invitations;
DROP POLICY IF EXISTS "Users can update invitations sent to their email" ON team_invitations;

-- Add policy for invited users to view their own invitations
CREATE POLICY "Users can view invitations sent to their email"
  ON team_invitations
  FOR SELECT
  USING (
    email IN (
      SELECT email 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Add policy for invited users to update their own invitations (accept/reject)
CREATE POLICY "Users can update invitations sent to their email"
  ON team_invitations
  FOR UPDATE
  USING (
    email IN (
      SELECT email 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );