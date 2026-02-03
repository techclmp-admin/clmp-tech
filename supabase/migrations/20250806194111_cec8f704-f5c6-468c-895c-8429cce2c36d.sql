-- Update the status constraint to include planning and other construction-relevant statuses
ALTER TABLE public.projects DROP CONSTRAINT projects_status_check;

-- Add new constraint with construction-relevant statuses
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
CHECK (status = ANY (ARRAY['planning', 'active', 'on_hold', 'completed', 'cancelled']::text[]));