-- Add the owner to project_members for the project that was just created
INSERT INTO public.project_members (project_id, user_id, role, invited_by)
VALUES ('482f4e5b-f420-46a8-ad86-0493d8c01fef', '3304fa3d-05b3-491f-95a6-72677f8ee4d1', 'owner', '3304fa3d-05b3-491f-95a6-72677f8ee4d1')
ON CONFLICT (project_id, user_id) DO NOTHING;