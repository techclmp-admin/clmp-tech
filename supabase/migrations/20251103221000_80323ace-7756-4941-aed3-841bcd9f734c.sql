-- Add missing columns to project_templates
ALTER TABLE public.project_templates 
ADD COLUMN IF NOT EXISTS estimated_duration TEXT,
ADD COLUMN IF NOT EXISTS estimated_budget TEXT,
ADD COLUMN IF NOT EXISTS complexity TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS required_permits JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ontario_building_code_version TEXT;