-- Add system_admin role to william@hkmm.ca
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'system_admin'::app_role
FROM auth.users
WHERE email = 'william@hkmm.ca'
ON CONFLICT (user_id, role) DO NOTHING;