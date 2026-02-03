-- Add category column to projects table
ALTER TABLE public.projects ADD COLUMN category text;

-- Update existing project templates to only include construction categories
UPDATE public.project_templates 
SET category = 'commercial' 
WHERE category = 'mobile_development' OR category = 'web_development';

-- Delete non-construction templates
DELETE FROM public.project_templates 
WHERE category IN ('mobile_development', 'web_development');