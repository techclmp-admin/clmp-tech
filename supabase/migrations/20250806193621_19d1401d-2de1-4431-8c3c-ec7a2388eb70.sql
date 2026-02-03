-- Remove non-construction templates
DELETE FROM public.project_templates 
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440002', -- Mobile App Development
  '550e8400-e29b-41d4-a716-446655440001'  -- E-commerce Development
);

-- Remove duplicate templates, keeping only the new ones with proper UUIDs
DELETE FROM public.project_templates 
WHERE id IN (
  'aa7f7e90-badc-4983-bc57-a047d6439de0', -- Old Commercial Construction
  '4048f536-9e52-43ae-9d47-a33e4a3e34e6', -- Old Renovation Project  
  '9bde869a-99b6-4567-aab7-555e52bbc9db'  -- Old Residential Construction
);