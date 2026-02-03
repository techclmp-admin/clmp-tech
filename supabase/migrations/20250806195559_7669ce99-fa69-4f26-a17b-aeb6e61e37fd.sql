-- Check if current_phase column has constraints and fix the default value
ALTER TABLE public.projects ALTER COLUMN current_phase SET DEFAULT 'planning'::project_phase;

-- Also ensure the column is nullable for now to avoid issues
ALTER TABLE public.projects ALTER COLUMN current_phase DROP NOT NULL;