-- First remove the default value, then change the column type, then add back the default
ALTER TABLE public.projects 
ALTER COLUMN current_phase DROP DEFAULT;

ALTER TABLE public.projects 
ALTER COLUMN current_phase TYPE project_phase 
USING current_phase::project_phase;

ALTER TABLE public.projects 
ALTER COLUMN current_phase SET DEFAULT 'bidding'::project_phase;