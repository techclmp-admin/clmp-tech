-- Add location column to projects table
ALTER TABLE public.projects ADD COLUMN location text;

-- Insert construction-specific project templates
INSERT INTO public.project_templates (id, name, description, category, template_data, is_system_template, is_active) 
VALUES 
(
  '10000000-0000-0000-0000-000000000001',
  'Residential Construction',
  'Template for residential building projects',
  'residential',
  '{"phases": ["Planning", "Foundation", "Framing", "Roofing", "Interior", "Final"], "default_tasks": [{"name": "Site Survey", "phase": "Planning"}, {"name": "Permits", "phase": "Planning"}, {"name": "Excavation", "phase": "Foundation"}]}',
  true,
  true
),
(
  '10000000-0000-0000-0000-000000000002', 
  'Commercial Construction',
  'Template for commercial building projects',
  'commercial',
  '{"phases": ["Pre-Construction", "Site Preparation", "Structure", "MEP", "Interior Fit-out", "Commissioning"], "default_tasks": [{"name": "Design Review", "phase": "Pre-Construction"}, {"name": "Site Preparation", "phase": "Site Preparation"}]}',
  true,
  true
),
(
  '10000000-0000-0000-0000-000000000003',
  'Renovation Project', 
  'Template for home renovation projects',
  'renovation',
  '{"phases": ["Assessment", "Design", "Demolition", "Construction", "Finishing"], "default_tasks": [{"name": "Current State Assessment", "phase": "Assessment"}, {"name": "Design Planning", "phase": "Design"}]}',
  true,
  true
),
(
  '10000000-0000-0000-0000-000000000004',
  'Infrastructure Project',
  'Template for infrastructure development projects', 
  'infrastructure',
  '{"phases": ["Planning", "Site Preparation", "Construction", "Testing", "Completion"], "default_tasks": [{"name": "Environmental Assessment", "phase": "Planning"}, {"name": "Utility Mapping", "phase": "Site Preparation"}]}',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  template_data = EXCLUDED.template_data,
  is_active = EXCLUDED.is_active;