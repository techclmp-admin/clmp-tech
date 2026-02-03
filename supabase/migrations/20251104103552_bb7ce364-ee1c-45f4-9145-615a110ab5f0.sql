-- =====================================================
-- Settings Page Database Enhancements
-- =====================================================

-- Add appearance/preference columns to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'theme') THEN
    ALTER TABLE public.profiles ADD COLUMN theme TEXT DEFAULT 'system';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'language') THEN
    ALTER TABLE public.profiles ADD COLUMN language TEXT DEFAULT 'en';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'timezone') THEN
    ALTER TABLE public.profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_format') THEN
    ALTER TABLE public.profiles ADD COLUMN date_format TEXT DEFAULT 'MM/DD/YYYY';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'currency') THEN
    ALTER TABLE public.profiles ADD COLUMN currency TEXT DEFAULT 'CAD';
  END IF;
END $$;

-- Create storage bucket for user uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  true,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-uploads bucket
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-uploads' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-uploads' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[2]
  )
  WITH CHECK (
    bucket_id = 'user-uploads' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-uploads' 
    AND (storage.foldername(name))[1] = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = 'avatars');

-- Ensure notification_preferences table exists with proper structure
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  channels JSONB DEFAULT '{"email": true, "push": false, "sms": false}'::jsonb,
  frequency TEXT DEFAULT 'immediate',
  custom_template TEXT,
  quiet_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, notification_type)
);

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notification preferences policies
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage their own notification preferences"
  ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- MFA settings table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMP WITH TIME ZONE,
  backup_codes JSONB,
  last_used_method TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on user_mfa_settings
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- MFA settings policies
DROP POLICY IF EXISTS "Users can view their own MFA settings" ON public.user_mfa_settings;
CREATE POLICY "Users can view their own MFA settings"
  ON public.user_mfa_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own MFA settings" ON public.user_mfa_settings;
CREATE POLICY "Users can manage their own MFA settings"
  ON public.user_mfa_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_preferences_updated_at();

DROP TRIGGER IF EXISTS trigger_update_user_mfa_settings_updated_at ON public.user_mfa_settings;
CREATE TRIGGER trigger_update_user_mfa_settings_updated_at
  BEFORE UPDATE ON public.user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_preferences_updated_at();