-- Fix all remaining references to project_phase enum

-- First, fix the project_lifecycle table
DO $$
BEGIN
    -- Check if project_lifecycle exists and fix it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_lifecycle') THEN
        -- Save current values
        ALTER TABLE public.project_lifecycle ADD COLUMN phase_temp text;
        UPDATE public.project_lifecycle SET phase_temp = 
            CASE 
                WHEN phase = 'bidding'::project_phase THEN 'bidding'
                WHEN phase = 'contract_signing'::project_phase THEN 'contract_signing'
                WHEN phase = 'planning'::project_phase THEN 'planning'
                WHEN phase = 'execution'::project_phase THEN 'execution'
                WHEN phase = 'inspection'::project_phase THEN 'inspection'
                WHEN phase = 'warranty'::project_phase THEN 'warranty'
                WHEN phase = 'maintenance'::project_phase THEN 'maintenance'
                WHEN phase = 'closed'::project_phase THEN 'closed'
                ELSE 'bidding'
            END;
        
        -- Drop and recreate column
        ALTER TABLE public.project_lifecycle DROP COLUMN phase;
        ALTER TABLE public.project_lifecycle ADD COLUMN phase text DEFAULT 'bidding';
        UPDATE public.project_lifecycle SET phase = phase_temp;
        ALTER TABLE public.project_lifecycle DROP COLUMN phase_temp;
    END IF;
END $$;

-- Fix the functions that reference project_phase enum
CREATE OR REPLACE FUNCTION public.transition_project_phase(
  project_id_param uuid,
  new_phase text,
  new_status text DEFAULT 'pending',
  notes_param text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  lifecycle_id UUID;
  old_phase TEXT;
  project_record RECORD;
BEGIN
  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.project_members pm 
    WHERE pm.project_id = project_id_param 
    AND pm.user_id = auth.uid() 
    AND pm.role IN ('admin', 'manager')
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only project admins can transition phases';
  END IF;
  
  -- Get current phase
  SELECT phase INTO old_phase 
  FROM public.project_lifecycle 
  WHERE project_id = project_id_param 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Complete previous phase
  UPDATE public.project_lifecycle 
  SET 
    completed_at = now(),
    completed_by = auth.uid()
  WHERE project_id = project_id_param 
  AND completed_at IS NULL;
  
  -- Create new phase record
  INSERT INTO public.project_lifecycle (
    project_id,
    phase,
    status,
    notes,
    completed_by
  ) VALUES (
    project_id_param,
    new_phase,
    new_status,
    notes_param,
    auth.uid()
  ) RETURNING id INTO lifecycle_id;
  
  -- Get project details for event
  SELECT * INTO project_record FROM public.projects WHERE id = project_id_param;
  
  -- Emit system event if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'emit_system_event') THEN
    PERFORM public.emit_system_event(
      'project_phase_changed',
      project_id_param,
      'project',
      jsonb_build_object(
        'old_phase', old_phase,
        'new_phase', new_phase,
        'new_status', new_status,
        'project_name', project_record.name,
        'lifecycle_id', lifecycle_id
      )
    );
  END IF;
  
  RETURN lifecycle_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_project_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create initial lifecycle entry
  INSERT INTO public.project_lifecycle (
    project_id,
    phase,
    status,
    notes
  ) VALUES (
    NEW.id,
    'bidding',
    'pending',
    'Project created and lifecycle initialized'
  );
  
  -- Emit project created event if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'emit_system_event') THEN
    PERFORM public.emit_system_event(
      'project_created',
      NEW.id,
      'project',
      jsonb_build_object(
        'project_name', NEW.name,
        'created_by', NEW.created_by,
        'initial_phase', 'bidding'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;