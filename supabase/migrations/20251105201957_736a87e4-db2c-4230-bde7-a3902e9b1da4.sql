-- Enable RLS on project_tasks
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view tasks of projects they belong to
CREATE POLICY "Members can view project tasks"
ON public.project_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_tasks.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Policy: Members can insert tasks into projects they belong to  
CREATE POLICY "Members can create project tasks"
ON public.project_tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_tasks.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Policy: Members can update tasks in projects they belong to
CREATE POLICY "Members can update project tasks"
ON public.project_tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_tasks.project_id
    AND project_members.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_tasks.project_id
    AND project_members.user_id = auth.uid()
  )
);

-- Policy: Members can delete tasks in projects they belong to
CREATE POLICY "Members can delete project tasks"
ON public.project_tasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = project_tasks.project_id
    AND project_members.user_id = auth.uid()
  )
);