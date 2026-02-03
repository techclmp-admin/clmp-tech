-- Fix project_phases table if it exists and has the same enum issue
DO $$
BEGIN
    -- Check if project_phases table exists and has phase column with project_phase enum
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_phases' 
        AND column_name = 'phase' 
        AND udt_name = 'project_phase'
    ) THEN
        -- Save current values
        ALTER TABLE public.project_phases ADD COLUMN phase_temp text;
        UPDATE public.project_phases SET phase_temp = 
            CASE 
                WHEN phase = 'bidding'::project_phase THEN 'bidding'
                WHEN phase = 'contract_signing'::project_phase THEN 'contract_signing'
                WHEN phase = 'planning'::project_phase THEN 'planning'
                WHEN phase = 'execution'::project_phase THEN 'execution'
                WHEN phase = 'inspection'::project_phase THEN 'inspection'
                WHEN phase = 'warranty'::project_phase THEN 'warranty'
                WHEN phase = 'maintenance'::project_phase THEN 'maintenance'
                WHEN phase = 'closed'::project_phase THEN 'closed'
                ELSE 'planning'
            END;
        
        -- Drop and recreate column
        ALTER TABLE public.project_phases DROP COLUMN phase;
        ALTER TABLE public.project_phases ADD COLUMN phase text DEFAULT 'planning';
        UPDATE public.project_phases SET phase = phase_temp;
        ALTER TABLE public.project_phases DROP COLUMN phase_temp;
    END IF;
END $$;