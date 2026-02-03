-- Create function to clean up orphan profiles (profiles without auth users)
CREATE OR REPLACE FUNCTION public.admin_delete_orphan_profile(
  profile_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_id UUID;
  result JSON;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can delete profiles';
  END IF;

  -- Get profile ID
  SELECT id INTO profile_id 
  FROM public.profiles 
  WHERE email = profile_email;

  IF profile_id IS NULL THEN
    result := json_build_object(
      'success', false,
      'message', 'Profile not found'
    );
    RETURN result;
  END IF;

  -- Delete from user_roles first (foreign key constraint)
  DELETE FROM public.user_roles WHERE user_id = profile_id;

  -- Delete profile
  DELETE FROM public.profiles WHERE id = profile_id;

  result := json_build_object(
    'success', true,
    'message', 'Orphan profile deleted successfully',
    'email', profile_email
  );

  RETURN result;
END;
$$;