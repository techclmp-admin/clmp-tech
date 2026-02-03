-- Fix RLS policy for project_members to avoid circular dependency
-- Users should be able to see project_members records where they are a member
-- or where they created/manage the project

-- Drop the existing policy
DROP POLICY IF EXISTS "project_members_all_operations" ON public.project_members;

-- Create separate policies for better clarity and performance
CREATE POLICY "Users can view project members"
  ON public.project_members
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR project_id IN (
      SELECT id FROM public.projects 
      WHERE created_by = auth.uid() 
      OR project_manager_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project creators can manage members"
  ON public.project_members
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE created_by = auth.uid() OR project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Project creators can update members"
  ON public.project_members
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE created_by = auth.uid() OR project_manager_id = auth.uid()
    )
  );

CREATE POLICY "Project creators can delete members"
  ON public.project_members
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE created_by = auth.uid() OR project_manager_id = auth.uid()
    )
  );