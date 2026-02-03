-- Update the can_access_project function to also check project_members table
CREATE OR REPLACE FUNCTION public.can_access_project(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = _project_id
    AND (
      p.created_by = _user_id 
      OR p.project_manager_id = _user_id
    )
  ) OR EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = _project_id
    AND pm.user_id = _user_id
    AND pm.role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;