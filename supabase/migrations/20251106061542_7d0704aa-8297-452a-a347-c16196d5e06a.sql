
-- Update handle_new_user function to also assign default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
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

-- Assign 'user' role to users who don't have any role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates profile and assigns default "user" role when a new user signs up';
