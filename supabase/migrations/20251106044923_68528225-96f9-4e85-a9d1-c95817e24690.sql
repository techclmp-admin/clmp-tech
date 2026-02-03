-- Update handle_new_user trigger to start users on Free plan instead of Trial
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
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    'free',  -- Start with Free plan
    'active', -- Active status
    now(),
    now()
  );
  RETURN new;
END;
$$;

-- Update check_expired_trials to handle trial expiry by reverting to free plan
CREATE OR REPLACE FUNCTION public.check_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    subscription_status = 'active',
    subscription_plan = 'free',
    updated_at = now()
  WHERE 
    trial_end_date IS NOT NULL 
    AND trial_end_date < now()
    AND subscription_status = 'active'
    AND subscription_plan IN ('professional', 'enterprise');
END;
$$;