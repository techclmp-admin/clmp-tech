-- Fix infinite recursion in RLS involving project_members by moving membership checks into SECURITY DEFINER helper

-- Helper function: check if a user is a member of a project (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_id = _project_id
      AND user_id = _user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_project_member(uuid, uuid) TO public;

-- 1) project_members SELECT policy (was self-referential via EXISTS on project_members)
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
CREATE POLICY "Members can view project members"
ON public.project_members
FOR SELECT
USING (
  public.is_project_member(project_id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 2) projects SELECT policy (use helper to avoid recursion chain)
DROP POLICY IF EXISTS "Project members can view projects" ON public.projects;
CREATE POLICY "Project members can view projects"
ON public.projects
FOR SELECT
USING (
  owner_id = auth.uid()
  OR public.is_project_member(projects.id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3) project_chat_rooms policies (use helper)
DROP POLICY IF EXISTS "Members can view chat rooms" ON public.project_chat_rooms;
CREATE POLICY "Members can view chat rooms"
ON public.project_chat_rooms
FOR SELECT
USING (
  project_id IS NULL
  OR public.is_project_member(project_id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Members can create chat rooms" ON public.project_chat_rooms;
CREATE POLICY "Members can create chat rooms"
ON public.project_chat_rooms
FOR INSERT
WITH CHECK (
  project_id IS NULL
  OR public.is_project_member(project_id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);
