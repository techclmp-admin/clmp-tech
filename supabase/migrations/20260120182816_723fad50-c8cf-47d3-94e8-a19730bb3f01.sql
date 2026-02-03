-- Add policy to allow invited users to see their own invitations
-- This is crucial so that users can see and accept/reject project invitations

-- Policy: Users can view invitations sent to their email address
CREATE POLICY "Invited users can view their invitations"
ON public.team_invitations
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Policy: Invited users can update their invitation status (accept/reject)
CREATE POLICY "Invited users can respond to invitations"
ON public.team_invitations
FOR UPDATE
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);