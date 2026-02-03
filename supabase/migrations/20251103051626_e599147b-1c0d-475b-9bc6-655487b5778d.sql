-- Fix the calculate_project_progress function to use correct column name
CREATE OR REPLACE FUNCTION public.calculate_project_progress(project_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_tasks INTEGER := 0;
  completed_tasks INTEGER := 0;
  progress_value INTEGER := 0;
BEGIN
  -- Count total tasks
  SELECT COUNT(*) INTO total_tasks
  FROM public.project_tasks
  WHERE project_id = project_id_param;
  
  -- Count completed tasks
  SELECT COUNT(*) INTO completed_tasks
  FROM public.project_tasks
  WHERE project_id = project_id_param AND status = 'completed';
  
  -- Calculate percentage
  IF total_tasks > 0 THEN
    progress_value := ROUND((completed_tasks::DECIMAL / total_tasks::DECIMAL) * 100);
  END IF;
  
  -- Update project progress (using correct column name: progress, not progress_percentage)
  UPDATE public.projects
  SET progress = progress_value,
      updated_at = now()
  WHERE id = project_id_param;
  
  RETURN progress_value;
END;
$$;