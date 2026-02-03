-- Temporarily change current_phase to text to bypass the enum issue
ALTER TABLE public.projects ALTER COLUMN current_phase DROP DEFAULT;
ALTER TABLE public.projects ALTER COLUMN current_phase TYPE text USING current_phase::text;
ALTER TABLE public.projects ALTER COLUMN current_phase SET DEFAULT 'planning';

-- Also check if there are any other columns using project_phase enum that might be causing issues
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE udt_name = 'project_phase' 
        AND table_schema = 'public'
    LOOP
        RAISE NOTICE 'Found project_phase usage in %.%', rec.table_name, rec.column_name;
    END LOOP;
END $$;