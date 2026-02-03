-- Fix log_member_activity trigger to handle cascade deletes
CREATE OR REPLACE FUNCTION public.log_member_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  project_exists BOOLEAN;
BEGIN
  -- Check if project still exists (to handle cascade deletes)
  IF TG_OP = 'DELETE' THEN
    SELECT EXISTS(SELECT 1 FROM public.projects WHERE id = OLD.project_id) INTO project_exists;
    
    -- Don't log if project no longer exists (cascade delete scenario)
    IF NOT project_exists THEN
      RETURN OLD;
    END IF;
  END IF;

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
      COALESCE(NEW.invited_by, auth.uid(), NEW.user_id),
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
      COALESCE(auth.uid(), OLD.user_id),
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
      COALESCE(auth.uid(), NEW.user_id),
      'role_changed',
      NEW.user_id,
      OLD.role,
      NEW.role,
      jsonb_build_object('member_id', NEW.id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;