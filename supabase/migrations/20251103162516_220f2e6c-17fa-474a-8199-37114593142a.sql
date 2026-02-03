-- Create project_invitations table
CREATE TABLE IF NOT EXISTS public.project_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_project_invitations_project_id ON public.project_invitations(project_id);
CREATE INDEX idx_project_invitations_email ON public.project_invitations(email);
CREATE INDEX idx_project_invitations_token ON public.project_invitations(token);
CREATE INDEX idx_project_invitations_status ON public.project_invitations(status);

-- Enable RLS
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Project members can view invitations for their projects
CREATE POLICY "Project members can view invitations"
ON public.project_invitations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_invitations.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Policy: Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations"
ON public.project_invitations
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Policy: Project admins can create invitations
CREATE POLICY "Project admins can create invitations"
ON public.project_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_invitations.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('admin', 'owner')
  )
);

-- Policy: Project admins can update invitations
CREATE POLICY "Project admins can update invitations"
ON public.project_invitations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_invitations.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('admin', 'owner')
  )
);

-- Policy: Project admins can delete invitations
CREATE POLICY "Project admins can delete invitations"
ON public.project_invitations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_invitations.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('admin', 'owner')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_invitations_updated_at
BEFORE UPDATE ON public.project_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();