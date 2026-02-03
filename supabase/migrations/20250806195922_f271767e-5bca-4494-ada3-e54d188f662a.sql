-- First check if there are any records in the projects table
SELECT COUNT(*) as project_count FROM public.projects;

-- If there are records, let's see what's in current_phase
SELECT DISTINCT current_phase FROM public.projects;