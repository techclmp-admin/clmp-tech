-- Simplify the SELECT policy to avoid any potential recursion
DROP POLICY IF EXISTS "Users can view project members if they have access" ON public.project_members;

CREATE POLICY "Users can view project members if they have access"
  ON public.project_members
  FOR SELECT
  USING (
    -- User can see their own membership
    user_id = auth.uid() 
    -- Or if they own/manage the project
    OR public.can_access_project(project_id, auth.uid())
  );