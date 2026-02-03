-- Function to create missing profiles for existing auth users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.profiles)
  LOOP
    INSERT INTO public.profiles (
      id, 
      email, 
      first_name,
      last_name,
      language, 
      currency, 
      date_format, 
      theme, 
      timezone, 
      email_signature_enabled, 
      is_banned
    ) VALUES (
      user_record.id,
      user_record.email,
      user_record.raw_user_meta_data->>'first_name',
      user_record.raw_user_meta_data->>'last_name',
      'en',
      'CAD',
      'MM/DD/YYYY',
      'system',
      'UTC',
      true,
      false
    );
    
    RAISE NOTICE 'Created profile for user: % (%)', user_record.email, user_record.id;
  END LOOP;
END $$;