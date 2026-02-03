-- Fix the auto_add_team_member trigger to use team_owner_id instead of owner_id
CREATE OR REPLACE FUNCTION public.auto_add_team_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (user_id, team_owner_id, role, status)
  VALUES (NEW.user_id, NEW.user_id, 'admin', 'accepted')
  ON CONFLICT (user_id, team_owner_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add an UPDATE policy for team_members to allow invited users to accept/reject
DROP POLICY IF EXISTS "Users can update their invitation status" ON public.team_members;
CREATE POLICY "Users can update their invitation status" ON public.team_members
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Verify the existing policies
-- Team owners can manage team (ALL)
-- Users can view their team (SELECT where user_id = auth.uid() OR team_owner_id = auth.uid())