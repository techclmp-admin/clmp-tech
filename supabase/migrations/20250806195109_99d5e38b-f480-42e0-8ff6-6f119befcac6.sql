-- Drop all existing project policies to start fresh
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects they created or are members of" ON public.projects;
DROP POLICY IF EXISTS "Project creators and managers can update projects" ON public.projects;
DROP POLICY IF EXISTS "Only project creators can delete projects" ON public.projects;

-- Create security definer function to check project membership
CREATE OR REPLACE FUNCTION public.is_project_member(project_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = is_project_member.project_id 
    AND project_members.user_id = is_project_member.user_id
  );
$$;

-- Create security definer function to check if user is project admin/manager
CREATE OR REPLACE FUNCTION public.is_project_admin_or_manager(project_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_members.project_id = is_project_admin_or_manager.project_id 
    AND project_members.user_id = is_project_admin_or_manager.user_id
    AND project_members.role IN ('admin', 'manager')
  );
$$;

-- Create new policies using security definer functions
CREATE POLICY "Users can create their own projects" ON public.projects
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view projects they have access to" ON public.projects
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  auth.uid() = project_manager_id OR
  public.is_project_member(id, auth.uid())
);

CREATE POLICY "Project creators and managers can update projects" ON public.projects
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  auth.uid() = project_manager_id OR
  public.is_project_admin_or_manager(id, auth.uid())
);

CREATE POLICY "Only project creators can delete projects" ON public.projects
FOR DELETE 
USING (auth.uid() = created_by);