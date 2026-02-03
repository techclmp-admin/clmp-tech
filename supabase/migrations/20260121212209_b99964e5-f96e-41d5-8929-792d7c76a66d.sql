-- Sync is_enabled with enabled for all rows to ensure consistency
-- This ensures both legacy and new components read the same state
UPDATE public.global_feature_settings 
SET is_enabled = enabled 
WHERE is_enabled IS DISTINCT FROM enabled;

-- Add a trigger to keep both columns in sync automatically
CREATE OR REPLACE FUNCTION public.sync_feature_enabled_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep both columns in sync
  IF NEW.enabled IS DISTINCT FROM OLD.enabled THEN
    NEW.is_enabled := NEW.enabled;
  ELSIF NEW.is_enabled IS DISTINCT FROM OLD.is_enabled THEN
    NEW.enabled := NEW.is_enabled;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_feature_enabled ON public.global_feature_settings;

CREATE TRIGGER sync_feature_enabled
BEFORE UPDATE ON public.global_feature_settings
FOR EACH ROW
EXECUTE FUNCTION public.sync_feature_enabled_columns();