-- Create team_members table for company/organization members (separate from project_members)
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, owner_id)
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Policies: Users can see team members where they are the owner or a member
CREATE POLICY "Users can view their team members"
ON public.team_members
FOR SELECT
USING (
  auth.uid() = owner_id OR 
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.owner_id = team_members.owner_id 
    AND tm.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can add team members"
ON public.team_members
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update team members"
ON public.team_members
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete team members"
ON public.team_members
FOR DELETE
USING (auth.uid() = owner_id);

-- Add trigger for updated_at
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-add user as their own team member when they sign up (they are the "owner" of their team)
CREATE OR REPLACE FUNCTION public.auto_add_team_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_members (user_id, owner_id, role)
  VALUES (NEW.id, NEW.id, 'admin')
  ON CONFLICT (user_id, owner_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-add team member on profile creation
CREATE TRIGGER on_profile_created_add_team_member
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_team_member();