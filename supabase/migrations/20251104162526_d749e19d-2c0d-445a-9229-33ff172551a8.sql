-- Insert admin role for william@hkmm.ca
INSERT INTO public.user_roles (user_id, role)
VALUES ('2fc4b91d-40b1-41db-ae55-460217bd36ee', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;