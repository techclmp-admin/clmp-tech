-- Add 'archived' status to projects_status_check constraint
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_status_check 
CHECK (status = ANY (ARRAY['planning'::text, 'active'::text, 'on_hold'::text, 'completed'::text, 'cancelled'::text, 'archived'::text]));