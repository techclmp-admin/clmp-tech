
-- Update handle_new_user function to set trial dates automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles with trial subscription
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name,
    subscription_plan,
    subscription_status,
    trial_start_date,
    trial_end_date,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'trial',
    'active',
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, silently continue
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates profile with 30-day trial subscription and assigns default "user" role when a new user signs up';
