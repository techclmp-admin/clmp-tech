-- Create blocked_members table
CREATE TABLE IF NOT EXISTS public.blocked_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.blocked_members ENABLE ROW LEVEL SECURITY;

-- Policies for blocked_members
CREATE POLICY "Project members can view blocked members"
  ON public.blocked_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = blocked_members.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owner and managers can block members"
  ON public.blocked_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = blocked_members.project_id
      AND projects.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = blocked_members.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "Project owner and managers can unblock members"
  ON public.blocked_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = blocked_members.project_id
      AND projects.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = blocked_members.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role IN ('manager', 'admin')
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_blocked_members_project_id ON public.blocked_members(project_id);
CREATE INDEX idx_blocked_members_user_id ON public.blocked_members(user_id);

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocked_members
    WHERE project_id = p_project_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;