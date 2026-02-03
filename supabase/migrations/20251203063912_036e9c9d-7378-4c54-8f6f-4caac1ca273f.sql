-- Seed existing users into team_members (each user becomes admin of their own team)
INSERT INTO public.team_members (user_id, owner_id, role)
SELECT id, id, 'admin' FROM public.profiles
ON CONFLICT (user_id, owner_id) DO NOTHING;