-- Drop the overly broad policy
DROP POLICY IF EXISTS projects_all_operations ON public.projects;

-- Create more specific policies for projects table
CREATE POLICY "Users can create their own projects" ON public.projects
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view projects they created or are members of" ON public.projects
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  auth.uid() = project_manager_id OR
  id IN (
    SELECT project_id FROM project_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Project creators and managers can update projects" ON public.projects
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  auth.uid() = project_manager_id OR
  id IN (
    SELECT project_id FROM project_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Only project creators can delete projects" ON public.projects
FOR DELETE 
USING (auth.uid() = created_by);