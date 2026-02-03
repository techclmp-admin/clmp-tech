-- Create role changes history table
CREATE TABLE IF NOT EXISTS public.role_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  old_role TEXT NOT NULL,
  new_role TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.role_changes ENABLE ROW LEVEL SECURITY;

-- Allow project members to view role change history
CREATE POLICY "Project members can view role changes"
ON public.role_changes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = role_changes.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Allow admins to insert role change records
CREATE POLICY "Admins can insert role changes"
ON public.role_changes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = role_changes.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_role_changes_project_id ON public.role_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_role_changes_user_id ON public.role_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_role_changes_created_at ON public.role_changes(created_at DESC);