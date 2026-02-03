
-- Create profiles for auth users that don't have them
INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'first_name',
  au.raw_user_meta_data->>'last_name',
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
COMMENT ON TABLE public.profiles IS 'User profiles synced with auth.users. Trigger auto-creates profiles on user signup.';
