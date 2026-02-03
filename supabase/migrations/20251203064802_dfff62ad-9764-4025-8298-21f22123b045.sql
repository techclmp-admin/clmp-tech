-- Add policy for users to update their own invitations (to accept them)
CREATE POLICY "Users can update their own invitations"
ON public.team_members
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Add policy for users to delete their own invitations (to reject them)
CREATE POLICY "Users can delete their own pending invitations"
ON public.team_members
FOR DELETE
USING (auth.uid() = user_id AND status = 'pending');