-- Fix trigger that references non-existent joined_via field
CREATE OR REPLACE FUNCTION public.log_project_member_changes()
RETURNS TRIGGER AS $$
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
      COALESCE(NEW.invited_by, auth.uid()),
      'member_added',
      NEW.user_id,
      NEW.role,
      jsonb_build_object(
        'member_id', NEW.id,
        'joined_via', 'direct'
      )
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
      auth.uid(),
      'member_removed',
      OLD.user_id,
      OLD.role,
      jsonb_build_object(
        'member_id', OLD.id
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;