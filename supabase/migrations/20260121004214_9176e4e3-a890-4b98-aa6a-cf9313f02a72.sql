-- Create a function to send welcome email via edge function
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
BEGIN
  -- Get user email and name
  SELECT email, COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  INTO v_user_email, v_user_name
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Only send for new users (not updates)
  IF TG_OP = 'INSERT' THEN
    -- Use pg_net to call the edge function asynchronously
    PERFORM net.http_post(
      url := 'https://nkvhihqkfeqqkqhgthsv.supabase.co/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'template_key', 'welcome',
        'recipient_email', v_user_email,
        'recipient_user_id', NEW.user_id::text,
        'variables', jsonb_build_object(
          'user_name', v_user_name,
          'dashboard_url', 'https://clmp.ca/dashboard'
        )
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send welcome email: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger to send welcome email when profile is created
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON public.profiles;
CREATE TRIGGER send_welcome_email_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email();