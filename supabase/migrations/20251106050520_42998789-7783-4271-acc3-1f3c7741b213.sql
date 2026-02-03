-- Update to remove free plan as standalone option
-- Free is just the 30-day trial period, not a permanent plan

-- Update handle_new_user to start with Professional trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    subscription_plan,
    subscription_status,
    trial_start_date,
    trial_end_date,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'professional',  -- Start with Professional trial
    'active',
    now(),
    now() + INTERVAL '30 days',  -- 30-day trial
    now(),
    now()
  );
  RETURN new;
END;
$$;

-- Update check_expired_trials to set status to pending (no free downgrade)
CREATE OR REPLACE FUNCTION public.check_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    subscription_status = 'pending',  -- Account suspended until upgrade
    updated_at = now()
  WHERE 
    trial_end_date IS NOT NULL 
    AND trial_end_date < now()
    AND subscription_status = 'active'
    AND subscription_plan IN ('professional', 'enterprise');
END;
$$;

-- Update start_trial function to only work for pending users
CREATE OR REPLACE FUNCTION public.start_trial(plan_name TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
  current_plan TEXT;
  current_status TEXT;
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
  SELECT subscription_plan, subscription_status INTO current_plan, current_status
  FROM profiles
  WHERE id = user_id;

  -- Only allow trial restart for pending users (expired trials)
  IF current_status != 'pending' THEN
    RAISE EXCEPTION 'Can only start trial for accounts with expired trials';
  END IF;

  -- Start new trial
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