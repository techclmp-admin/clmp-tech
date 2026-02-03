-- Save current_phase values temporarily
ALTER TABLE public.projects ADD COLUMN current_phase_temp text;
UPDATE public.projects SET current_phase_temp = 
    CASE 
        WHEN current_phase = 'bidding'::project_phase THEN 'bidding'
        WHEN current_phase = 'contract_signing'::project_phase THEN 'contract_signing'
        WHEN current_phase = 'planning'::project_phase THEN 'planning'
        WHEN current_phase = 'execution'::project_phase THEN 'execution'
        WHEN current_phase = 'inspection'::project_phase THEN 'inspection'
        WHEN current_phase = 'warranty'::project_phase THEN 'warranty'
        WHEN current_phase = 'maintenance'::project_phase THEN 'maintenance'
        WHEN current_phase = 'closed'::project_phase THEN 'closed'
        ELSE 'planning'
    END;

-- Drop the problematic column
ALTER TABLE public.projects DROP COLUMN current_phase;

-- Recreate it as text
ALTER TABLE public.projects ADD COLUMN current_phase text DEFAULT 'planning';

-- Restore the values
UPDATE public.projects SET current_phase = current_phase_temp;

-- Drop the temporary column
ALTER TABLE public.projects DROP COLUMN current_phase_temp;