-- Fix: invited users couldn't see invitations because policy queried auth.users (permission issues).
-- Use JWT email claim instead.

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invited users can view their invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Invited users can respond to invitations" ON public.team_invitations;

CREATE POLICY "Invited users can view their invitations"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (
  lower(email) = lower((auth.jwt() ->> 'email'))
);

CREATE POLICY "Invited users can respond to invitations"
ON public.team_invitations
FOR UPDATE
TO authenticated
USING (
  lower(email) = lower((auth.jwt() ->> 'email'))
)
WITH CHECK (
  lower(email) = lower((auth.jwt() ->> 'email'))
);
