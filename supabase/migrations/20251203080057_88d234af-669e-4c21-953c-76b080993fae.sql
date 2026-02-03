-- Add authorization checks to SECURITY DEFINER functions

-- Fix calculate_user_xp function to only allow users to calculate their own XP or admins
CREATE OR REPLACE FUNCTION public.calculate_user_xp(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_xp integer := 0;
  caller_id uuid;
  is_admin boolean;
BEGIN
  -- Get the caller's user ID
  caller_id := auth.uid();
  
  -- Check if caller is authorized (must be the target user or an admin)
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = caller_id AND role = 'admin'
  ) INTO is_admin;
  
  -- Only allow if caller is the target user or an admin
  IF caller_id != target_user_id AND NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized - you can only calculate XP for yourself';
  END IF;

  -- Calculate XP from achievements
  SELECT COALESCE(SUM(a.xp_reward), 0) INTO total_xp
  FROM user_achievements ua
  JOIN achievements a ON ua.achievement_id = a.id
  WHERE ua.user_id = target_user_id;
  
  -- Update the user's profile with the calculated XP
  UPDATE profiles SET total_xp = total_xp WHERE id = target_user_id;
  
  RETURN total_xp;
END;
$$;

-- Fix run_security_test function to only allow admins
CREATE OR REPLACE FUNCTION public.run_security_test()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  is_admin boolean;
BEGIN
  -- Get the caller's user ID
  caller_id := auth.uid();
  
  -- Check if caller is authenticated
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = caller_id AND role = 'admin'
  ) INTO is_admin;
  
  -- Only allow admins to run security tests
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized - only admins can run security tests';
  END IF;

  -- Insert a security test result
  INSERT INTO security_test_results (
    test_name,
    test_suite,
    status,
    started_at,
    completed_at
  ) VALUES (
    'Manual Security Test',
    'manual',
    'completed',
    NOW(),
    NOW()
  );
END;
$$;