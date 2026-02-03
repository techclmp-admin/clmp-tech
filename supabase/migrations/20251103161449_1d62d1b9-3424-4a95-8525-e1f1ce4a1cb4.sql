-- Assign admin role to william@hkmm.ca (bootstrap first admin)
INSERT INTO user_roles (user_id, role_id, status, assigned_by)
SELECT 
  '2fc4b91d-40b1-41db-ae55-460217bd36ee'::uuid,
  '9a3a18ae-9858-4cc7-a788-f96a1cf9fc75'::uuid,
  'active',
  '2fc4b91d-40b1-41db-ae55-460217bd36ee'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = '2fc4b91d-40b1-41db-ae55-460217bd36ee'::uuid 
  AND role_id = '9a3a18ae-9858-4cc7-a788-f96a1cf9fc75'::uuid
);