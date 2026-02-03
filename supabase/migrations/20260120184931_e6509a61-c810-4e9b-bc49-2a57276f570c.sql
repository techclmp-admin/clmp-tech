-- Fix infinite recursion in RLS policies for projects and project_members
-- Root cause: policies reference other RLS-protected tables that themselves reference back, creating cycles.
-- Solution: use SECURITY DEFINER functions with row_security=off for membership/invitation checks.

-- 1) Replace is_project_member to bypass RLS inside the check
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE project_id = _project_id
      AND user_id = _user_id
  );
$$;

-- 2) Create an invitation check function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_invited_to_project(_project_id uuid, _email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_invitations ti
    WHERE ti.project_id = _project_id
      AND lower(ti.email) = lower(_email)
      AND ti.status = 'pending'
      AND COALESCE(ti.expires_at, now() + interval '100 years') > now()
  );
$$;

-- 3) Update projects invitee policy to use the function (no direct table reference)
DROP POLICY IF EXISTS "Invitees can view invited projects" ON public.projects;

CREATE POLICY "Invitees can view invited projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  public.is_invited_to_project(projects.id, (auth.jwt() ->> 'email'))
);
