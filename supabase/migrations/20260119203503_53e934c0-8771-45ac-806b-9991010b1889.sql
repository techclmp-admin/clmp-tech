-- Insert admin role for techclmp@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('3304fa3d-05b3-491f-95a6-72677f8ee4d1', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;