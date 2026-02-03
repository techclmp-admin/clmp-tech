-- Update the log_member_activity function to handle NULL user_id
CREATE OR REPLACE FUNCTION public.log_member_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.project_activity_log (
      project_id,
      user_id,
      action_type,
      target_user_id,
      new_value,
      metadata
    ) VALUES (
      NEW.project_id,
      COALESCE(NEW.invited_by, auth.uid(), NEW.user_id),  -- Use member's user_id as fallback
      'member_added',
      NEW.user_id,
      NEW.role,
      jsonb_build_object('member_id', NEW.id)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.project_activity_log (
      project_id,
      user_id,
      action_type,
      target_user_id,
      old_value,
      metadata
    ) VALUES (
      OLD.project_id,
      COALESCE(auth.uid(), OLD.user_id),  -- Use member's user_id as fallback
      'member_removed',
      OLD.user_id,
      OLD.role,
      jsonb_build_object('member_id', OLD.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    INSERT INTO public.project_activity_log (
      project_id,
      user_id,
      action_type,
      target_user_id,
      old_value,
      new_value,
      metadata
    ) VALUES (
      NEW.project_id,
      COALESCE(auth.uid(), NEW.user_id),  -- Use member's user_id as fallback
      'role_changed',
      NEW.user_id,
      OLD.role,
      NEW.role,
      jsonb_build_object('member_id', NEW.id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function to automatically add project creator as admin
CREATE OR REPLACE FUNCTION add_project_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the project creator as an admin in project_members
  INSERT INTO project_members (
    project_id,
    user_id,
    role,
    joined_at
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'admin',
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after project insert
DROP TRIGGER IF EXISTS on_project_created ON projects;
CREATE TRIGGER on_project_created
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_project_creator_as_member();

-- Backfill existing projects: add creators as admins if not already members
INSERT INTO project_members (project_id, user_id, role, joined_at)
SELECT 
  p.id as project_id,
  p.created_by as user_id,
  'admin' as role,
  p.created_at as joined_at
FROM projects p
WHERE p.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = p.id 
    AND pm.user_id = p.created_by
  );