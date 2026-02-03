-- Fix infinite recursion in RLS policies
-- Create security definer functions to avoid circular dependencies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Project creators can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Project creators can update members" ON public.project_members;
DROP POLICY IF EXISTS "Project creators can delete members" ON public.project_members;

-- Create security definer function to check if user can access project
CREATE OR REPLACE FUNCTION public.can_access_project(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = _project_id
    AND (
      p.created_by = _user_id 
      OR p.project_manager_id = _user_id
    )
  );
$$;

-- Create security definer function to check if user is project member
CREATE OR REPLACE FUNCTION public.is_member_of_project(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = _project_id
    AND pm.user_id = _user_id
  );
$$;

-- Create new RLS policies for project_members using security definer functions
CREATE POLICY "Users can view project members if they have access"
  ON public.project_members
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR public.can_access_project(project_id, auth.uid())
    OR public.is_member_of_project(project_id, auth.uid())
  );

CREATE POLICY "Project owners can add members"
  ON public.project_members
  FOR INSERT
  WITH CHECK (
    public.can_access_project(project_id, auth.uid())
  );

CREATE POLICY "Project owners can update members"
  ON public.project_members
  FOR UPDATE
  USING (
    public.can_access_project(project_id, auth.uid())
  );

CREATE POLICY "Project owners can remove members"
  ON public.project_members
  FOR DELETE
  USING (
    public.can_access_project(project_id, auth.uid())
  );