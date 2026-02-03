-- First, let's clean up the existing data and convert current_phase to text properly
-- Update existing records to use text values
UPDATE public.projects SET current_phase = current_phase::text;

-- Now change the column type to text
ALTER TABLE public.projects ALTER COLUMN current_phase DROP DEFAULT;
ALTER TABLE public.projects ALTER COLUMN current_phase TYPE text;
ALTER TABLE public.projects ALTER COLUMN current_phase SET DEFAULT 'planning';

-- Also need to handle other tables that might use project_phase enum
-- Check project_phases table
DO $$
BEGIN
    -- Try to convert project_phases.phase column as well if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_phases' AND column_name = 'phase') THEN
        ALTER TABLE public.project_phases ALTER COLUMN phase TYPE text USING phase::text;
    END IF;
END $$;