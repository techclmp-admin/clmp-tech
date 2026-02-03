-- Clear existing basic templates and insert professional Ontario templates
DELETE FROM project_templates WHERE id NOT IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003'
);

-- Update existing templates with new fields
UPDATE project_templates SET
  estimated_duration = '6-9 months',
  estimated_budget = '$350,000 - $600,000',
  complexity = 'high',
  required_permits = '["Building Permit", "Site Plan Approval", "Electrical Permit", "Plumbing Permit", "HVAC Permit"]'::jsonb,
  ontario_building_code_version = 'OBC 2012'
WHERE id = '10000000-0000-0000-0000-000000000001';

UPDATE project_templates SET
  estimated_duration = '8-12 months',
  estimated_budget = '$2M - $6M',
  complexity = 'high',
  required_permits = '["Building Permit", "Site Plan Approval", "Electrical Permit", "Plumbing Permit", "HVAC Permit", "Fire Protection Permit"]'::jsonb,
  ontario_building_code_version = 'OBC 2012'
WHERE id = '10000000-0000-0000-0000-000000000002';

UPDATE project_templates SET
  estimated_duration = '3-6 months',
  estimated_budget = '$150,000 - $400,000',
  complexity = 'medium',
  required_permits = '["Building Permit", "Electrical Permit", "Plumbing Permit"]'::jsonb,
  ontario_building_code_version = 'OBC 2012'
WHERE id = '10000000-0000-0000-0000-000000000003';