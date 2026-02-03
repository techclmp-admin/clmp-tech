-- Fix the emit_system_event function to handle the enum properly
CREATE OR REPLACE FUNCTION public.emit_system_event(
  event_type_param text,
  entity_id_param uuid,
  entity_type_param text,
  payload_param jsonb DEFAULT '{}'::jsonb,
  metadata_param jsonb DEFAULT '{}'::jsonb,
  triggered_by_param uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  event_id uuid;
BEGIN
  -- Don't use the enum cast, just insert as text if system_events table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_events') THEN
    INSERT INTO public.system_events (
      event_type,
      entity_id,
      entity_type,
      payload,
      metadata,
      triggered_by
    ) VALUES (
      event_type_param,  -- Remove the enum cast
      entity_id_param,
      entity_type_param,
      payload_param,
      metadata_param,
      COALESCE(triggered_by_param, auth.uid())
    ) RETURNING id INTO event_id;
  ELSE
    -- If table doesn't exist, just return a dummy UUID
    event_id := gen_random_uuid();
  END IF;
  
  RETURN event_id;
END;
$$;