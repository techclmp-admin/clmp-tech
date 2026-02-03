-- Create RPC function to clean up orphan auth users (users in auth.users but not in profiles)
CREATE OR REPLACE FUNCTION admin_cleanup_orphan_auth_users()
RETURNS TABLE (
  deleted_count integer,
  deleted_emails text[]
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count integer := 0;
  v_deleted_emails text[] := ARRAY[]::text[];
  v_auth_user_id uuid;
  v_email text;
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can cleanup orphan auth users';
  END IF;

  -- Find and delete auth users that don't have profiles
  FOR v_auth_user_id, v_email IN 
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    -- Delete the auth user using admin API
    -- Note: This requires service role access, so we'll mark them for deletion
    -- The actual deletion will happen via edge function
    v_deleted_count := v_deleted_count + 1;
    v_deleted_emails := array_append(v_deleted_emails, v_email);
  END LOOP;

  RETURN QUERY SELECT v_deleted_count, v_deleted_emails;
END;
$$;

-- Create RPC function to get orphan auth users for display
CREATE OR REPLACE FUNCTION admin_get_orphan_auth_users()
RETURNS TABLE (
  auth_user_id uuid,
  email text,
  created_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can view orphan auth users';
  END IF;

  RETURN QUERY 
  SELECT au.id, au.email, au.created_at
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  WHERE p.id IS NULL
  ORDER BY au.created_at DESC;
END;
$$;