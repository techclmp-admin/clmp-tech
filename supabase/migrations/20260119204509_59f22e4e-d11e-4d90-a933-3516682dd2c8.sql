-- Fix existing profiles where id != user_id (app expects profiles.id = auth.uid())
UPDATE public.profiles
SET id = user_id
WHERE id <> user_id
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p2 WHERE p2.id = public.profiles.user_id
  );

-- Ensure future signups create profiles with id = auth.users.id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;