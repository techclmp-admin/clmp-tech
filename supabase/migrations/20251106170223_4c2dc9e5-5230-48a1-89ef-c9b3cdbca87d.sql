-- Drop existing policy with ALL command
DROP POLICY IF EXISTS "Project admins can manage invitations" ON team_invitations;

-- Create separate policies for better control
CREATE POLICY "Project admins can view invitations"
  ON team_invitations
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Project admins can create invitations"
  ON team_invitations
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Project admins can update invitations"
  ON team_invitations
  FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Project admins can delete invitations"
  ON team_invitations
  FOR DELETE
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin', 'manager')
    )
  );