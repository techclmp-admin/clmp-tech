-- Allow invited users to see minimal project row so PostgREST embedded select (projects(name)) works.
-- This is needed for PendingInvitations which selects team_invitations -> projects(name).

DROP POLICY IF EXISTS "Invitees can view invited projects" ON public.projects;

CREATE POLICY "Invitees can view invited projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_invitations ti
    WHERE ti.project_id = projects.id
      AND ti.status = 'pending'
      AND coalesce(ti.expires_at, now() + interval '100 years') > now()
      AND lower(ti.email) = lower((auth.jwt() ->> 'email'))
  )
);
