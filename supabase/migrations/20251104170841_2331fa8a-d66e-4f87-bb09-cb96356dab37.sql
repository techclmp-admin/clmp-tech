-- Create admin function to create users with auth account and profile
CREATE OR REPLACE FUNCTION public.admin_create_user(
  user_email TEXT,
  user_password TEXT,
  user_first_name TEXT DEFAULT NULL,
  user_last_name TEXT DEFAULT NULL,
  user_role TEXT DEFAULT 'user'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create users';
  END IF;

  -- Check if user already exists in profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = user_email) THEN
    RAISE EXCEPTION 'User with email % already exists in profiles', user_email;
  END IF;

  -- Return instruction to create user via Supabase Auth
  result := json_build_object(
    'success', false,
    'message', 'Please use Supabase Admin API to create auth users. Profile will be auto-created via trigger.',
    'email', user_email
  );

  RETURN result;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.admin_create_user IS 'Admin function to validate before creating users. Actual user creation must be done via Supabase Auth API.';