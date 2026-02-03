-- 1. Update handle_new_user function to include subscription trial info and generate member_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_member_code TEXT;
BEGIN
  -- Generate unique member code (6 characters)
  v_member_code := UPPER(SUBSTRING(MD5(NEW.id::text || EXTRACT(EPOCH FROM NOW())::text) FROM 1 FOR 6));
  
  INSERT INTO public.profiles (
    id, 
    user_id, 
    email, 
    full_name,
    member_code,
    subscription_plan,
    subscription_status,
    trial_start_date,
    trial_end_date
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', NEW.email),
    v_member_code,
    'trial',
    'active',
    NOW(),
    NOW() + INTERVAL '30 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    member_code = COALESCE(profiles.member_code, EXCLUDED.member_code),
    subscription_plan = COALESCE(profiles.subscription_plan, EXCLUDED.subscription_plan),
    subscription_status = COALESCE(profiles.subscription_status, EXCLUDED.subscription_status),
    trial_start_date = COALESCE(profiles.trial_start_date, EXCLUDED.trial_start_date),
    trial_end_date = COALESCE(profiles.trial_end_date, EXCLUDED.trial_end_date);

  RETURN NEW;
END;
$$;

-- 2. Add trial_start_date column if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE;

-- 3. Generate member_code for existing users who don't have one
UPDATE public.profiles 
SET member_code = UPPER(SUBSTRING(MD5(user_id::text || id::text) FROM 1 FOR 6))
WHERE member_code IS NULL;

-- 4. Set trial info for existing users who don't have it (only if they don't have subscription_plan set properly)
UPDATE public.profiles 
SET 
  subscription_plan = CASE 
    WHEN subscription_plan IS NULL OR subscription_plan = '' THEN 'trial' 
    ELSE subscription_plan 
  END,
  subscription_status = CASE 
    WHEN subscription_status IS NULL OR subscription_status = '' THEN 'active' 
    ELSE subscription_status 
  END,
  trial_start_date = CASE 
    WHEN trial_start_date IS NULL THEN created_at 
    ELSE trial_start_date 
  END,
  trial_end_date = CASE 
    WHEN trial_end_date IS NULL THEN created_at + INTERVAL '30 days' 
    ELSE trial_end_date 
  END
WHERE trial_end_date IS NULL OR subscription_plan IS NULL OR subscription_plan = '';