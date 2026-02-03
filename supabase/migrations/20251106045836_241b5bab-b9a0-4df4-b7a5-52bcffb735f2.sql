-- Function for admins to extend trial period
CREATE OR REPLACE FUNCTION public.extend_trial(
  target_user_id UUID,
  additional_days INTEGER
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_trial_end TIMESTAMP WITH TIME ZONE;
  new_trial_end TIMESTAMP WITH TIME ZONE;
  current_plan TEXT;
  result json;
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role_tag(auth.uid(), 'admin_sysops') THEN
    RAISE EXCEPTION 'Permission denied: Only admins can extend trials';
  END IF;

  -- Validate additional_days
  IF additional_days <= 0 OR additional_days > 365 THEN
    RAISE EXCEPTION 'Invalid days: Must be between 1 and 365';
  END IF;

  -- Get current user info
  SELECT trial_end_date, subscription_plan
  INTO current_trial_end, current_plan
  FROM profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate new trial end date
  IF current_trial_end IS NULL OR current_trial_end < now() THEN
    -- If no trial or expired, start from now
    new_trial_end := now() + (additional_days || ' days')::interval;
    
    -- If user is on free plan, upgrade to professional trial
    IF current_plan = 'free' THEN
      UPDATE profiles
      SET 
        subscription_plan = 'professional',
        trial_start_date = now(),
        trial_end_date = new_trial_end,
        subscription_status = 'active',
        updated_at = now()
      WHERE id = target_user_id;
    ELSE
      -- Just extend the trial
      UPDATE profiles
      SET 
        trial_start_date = COALESCE(trial_start_date, now()),
        trial_end_date = new_trial_end,
        subscription_status = 'active',
        updated_at = now()
      WHERE id = target_user_id;
    END IF;
  ELSE
    -- Extend from current trial end date
    new_trial_end := current_trial_end + (additional_days || ' days')::interval;
    
    UPDATE profiles
    SET 
      trial_end_date = new_trial_end,
      subscription_status = 'active',
      updated_at = now()
    WHERE id = target_user_id;
  END IF;

  -- Return success with info
  SELECT json_build_object(
    'success', true,
    'user_id', target_user_id,
    'previous_trial_end', current_trial_end,
    'new_trial_end', new_trial_end,
    'days_added', additional_days
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute to authenticated users (function will check admin permission internally)
GRANT EXECUTE ON FUNCTION public.extend_trial(UUID, INTEGER) TO authenticated;