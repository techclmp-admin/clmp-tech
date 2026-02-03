-- Disable the problematic trigger temporarily
DROP TRIGGER IF EXISTS create_internal_email_address_trigger ON auth.users;

-- Simplify handle_new_user function to avoid metadata extraction issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_first_name TEXT;
  user_last_name TEXT;
BEGIN
  -- Safely extract metadata with NULL handling
  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  
  -- Insert profile with basic info
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id, 
    NULLIF(user_first_name, ''),
    NULLIF(user_last_name, ''),
    NEW.email
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;