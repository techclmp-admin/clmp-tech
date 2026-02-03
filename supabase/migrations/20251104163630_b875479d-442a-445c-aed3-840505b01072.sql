-- Add ban/unban functionality to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS banned_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned);

-- Create function to ban user
CREATE OR REPLACE FUNCTION public.ban_user(
  target_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can ban users';
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET 
    is_banned = true,
    banned_at = now(),
    banned_reason = reason,
    banned_by = auth.uid(),
    updated_at = now()
  WHERE id = target_user_id;

  RETURN true;
END;
$$;

-- Create function to unban user
CREATE OR REPLACE FUNCTION public.unban_user(
  target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can unban users';
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET 
    is_banned = false,
    banned_at = NULL,
    banned_reason = NULL,
    banned_by = NULL,
    updated_at = now()
  WHERE id = target_user_id;

  RETURN true;
END;
$$;