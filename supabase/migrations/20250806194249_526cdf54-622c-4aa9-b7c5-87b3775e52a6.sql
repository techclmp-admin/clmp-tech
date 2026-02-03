-- Fix the current_phase column to use the project_phase enum type
ALTER TABLE public.projects 
ALTER COLUMN current_phase TYPE project_phase 
USING current_phase::project_phase;