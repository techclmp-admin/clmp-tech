-- Add user as admin to all existing projects that don't have memberships yet  
INSERT INTO project_members (project_id, user_id, role, joined_at) 
SELECT p.id, '2fc4b91d-40b1-41db-ae55-460217bd36ee', 'admin', now()
FROM projects p 
LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = '2fc4b91d-40b1-41db-ae55-460217bd36ee'
WHERE pm.project_id IS NULL;