-- Update all project-related foreign keys to CASCADE on delete

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Find all foreign key constraints that reference projects table
    FOR r IN 
        SELECT 
            conname AS constraint_name,
            conrelid::regclass AS table_name
        FROM pg_constraint c
        WHERE confrelid = 'public.projects'::regclass
          AND contype = 'f'
    LOOP
        -- Drop the old constraint
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', 
            r.table_name, r.constraint_name);
        
        -- Add new constraint with CASCADE
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE', 
            r.table_name, r.constraint_name);
    END LOOP;
END $$;