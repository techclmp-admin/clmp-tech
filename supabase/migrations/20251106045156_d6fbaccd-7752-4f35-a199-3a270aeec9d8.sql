-- Function to start a trial period
CREATE OR REPLACE FUNCTION public.start_trial(plan_name TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
  current_plan TEXT;
  result json;
BEGIN
  -- Get current user
  user_id := auth.uid();
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate plan
  IF plan_name NOT IN ('professional', 'enterprise') THEN
    RAISE EXCEPTION 'Invalid plan name. Must be professional or enterprise';
  END IF;

  -- Get current subscription status
  SELECT subscription_plan INTO current_plan
  FROM profiles
  WHERE id = user_id;

  -- Check if user is on free plan
  IF current_plan != 'free' THEN
    RAISE EXCEPTION 'Can only start trial from free plan';
  END IF;

  -- Start trial
  UPDATE profiles
  SET 
    subscription_plan = plan_name,
    subscription_status = 'active',
    trial_start_date = now(),
    trial_end_date = now() + INTERVAL '30 days',
    updated_at = now()
  WHERE id = user_id;

  -- Return success with trial info
  SELECT json_build_object(
    'success', true,
    'plan', plan_name,
    'trial_start', now(),
    'trial_end', now() + INTERVAL '30 days'
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.start_trial(TEXT) TO authenticated;