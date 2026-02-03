-- Add current user as admin member to all existing projects
INSERT INTO project_members (project_id, user_id, role, permissions, joined_at)
SELECT 
  p.id,
  '2fc4b91d-40b1-41db-ae55-460217bd36ee'::uuid as user_id,
  'admin' as role,
  '["all"]'::jsonb as permissions,
  NOW() as joined_at
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_members pm 
  WHERE pm.project_id = p.id 
  AND pm.user_id = '2fc4b91d-40b1-41db-ae55-460217bd36ee'
);

-- Also fix the sample data projects we created to use the correct user_id
UPDATE projects 
SET created_by = '2fc4b91d-40b1-41db-ae55-460217bd36ee'
WHERE created_by != '2fc4b91d-40b1-41db-ae55-460217bd36ee';

-- Update project_manager_id as well
UPDATE projects 
SET project_manager_id = '2fc4b91d-40b1-41db-ae55-460217bd36ee'
WHERE project_manager_id IS NULL OR project_manager_id != '2fc4b91d-40b1-41db-ae55-460217bd36ee';