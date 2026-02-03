-- Drop the old constraint that uses text values
ALTER TABLE public.projects DROP CONSTRAINT projects_current_phase_check;

-- Remove the default value
ALTER TABLE public.projects ALTER COLUMN current_phase DROP DEFAULT;

-- Change the column type to use the enum
ALTER TABLE public.projects 
ALTER COLUMN current_phase TYPE project_phase 
USING current_phase::project_phase;

-- Set the default value using the enum type
ALTER TABLE public.projects 
ALTER COLUMN current_phase SET DEFAULT 'bidding'::project_phase;

-- Add the constraint back using enum values
ALTER TABLE public.projects ADD CONSTRAINT projects_current_phase_check 
CHECK (current_phase = ANY (ARRAY['bidding'::project_phase, 'contract_signing'::project_phase, 'planning'::project_phase, 'execution'::project_phase, 'inspection'::project_phase, 'warranty'::project_phase, 'maintenance'::project_phase, 'closed'::project_phase]));