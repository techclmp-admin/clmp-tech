-- Fix: Users need to see their own project_members row to load projects
-- Current policy: "Members can view project members" has circular dependency.
-- Solution: Add self-SELECT policy so user can always see their own memberships.

-- Drop and recreate SELECT policies on project_members

DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;

-- Users can always see their OWN membership rows
CREATE POLICY "Users can see their own memberships"
ON public.project_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users who are members can see OTHER members in the same project
-- (Using security definer function avoids recursion)
CREATE POLICY "Project members can see fellow members"
ON public.project_members
FOR SELECT
TO authenticated
USING (
  is_project_member(project_id, auth.uid())
);
