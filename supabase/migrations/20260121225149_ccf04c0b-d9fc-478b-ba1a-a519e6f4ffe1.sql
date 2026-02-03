-- Update the log_project_member_changes function to check if project exists before logging
-- This prevents foreign key constraint violations during cascade deletes

CREATE OR REPLACE FUNCTION public.log_project_member_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_type TEXT;
  v_target_user_id UUID;
  v_old_value TEXT;
  v_new_value TEXT;
  v_actor_id UUID;
  v_project_exists BOOLEAN;
BEGIN
  -- Get the actor (current user)
  v_actor_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    v_action_type := 'member_added';
    v_target_user_id := NEW.user_id;
    v_new_value := NEW.role;
    v_old_value := NULL;
    
    INSERT INTO public.project_activity_log (
      project_id,
      user_id,
      action,
      entity_type,
      entity_id,
      description,
      metadata
    ) VALUES (
      NEW.project_id,
      COALESCE(v_actor_id, NEW.invited_by, NEW.user_id),
      'member_added',
      'project_member',
      NEW.id,
      'Added member to project',
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'role', NEW.role
      )
    );
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Check if project still exists (to handle cascade deletes)
    SELECT EXISTS(SELECT 1 FROM public.projects WHERE id = OLD.project_id) INTO v_project_exists;
    
    -- Don't log if project no longer exists (cascade delete scenario)
    IF NOT v_project_exists THEN
      RETURN OLD;
    END IF;
    
    v_action_type := 'member_removed';
    v_target_user_id := OLD.user_id;
    v_old_value := OLD.role;
    v_new_value := NULL;
    
    INSERT INTO public.project_activity_log (
      project_id,
      user_id,
      action,
      entity_type,
      entity_id,
      description,
      metadata
    ) VALUES (
      OLD.project_id,
      COALESCE(v_actor_id, OLD.user_id),
      'member_removed',
      'project_member',
      OLD.id,
      'Removed member from project',
      jsonb_build_object(
        'target_user_id', OLD.user_id,
        'old_role', OLD.role
      )
    );
    
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if role changed
    IF OLD.role IS DISTINCT FROM NEW.role THEN
      INSERT INTO public.project_activity_log (
        project_id,
        user_id,
        action,
        entity_type,
        entity_id,
        description,
        metadata
      ) VALUES (
        NEW.project_id,
        COALESCE(v_actor_id, NEW.user_id),
        'role_changed',
        'project_member',
        NEW.id,
        'Changed member role',
        jsonb_build_object(
          'target_user_id', NEW.user_id,
          'old_role', OLD.role,
          'new_role', NEW.role
        )
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;