-- Drop existing SELECT policy and create simpler one
DROP POLICY IF EXISTS "Users can view their team members" ON public.team_members;

-- Simpler SELECT policy: owner can see their team, team members can see each other
CREATE POLICY "Users can view their team members"
ON public.team_members
FOR SELECT
USING (
  auth.uid() = owner_id OR 
  auth.uid() = user_id
);

-- Add status column to team_members for invitation workflow
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'accepted';

-- Update existing records to 'accepted'
UPDATE public.team_members SET status = 'accepted' WHERE status IS NULL;