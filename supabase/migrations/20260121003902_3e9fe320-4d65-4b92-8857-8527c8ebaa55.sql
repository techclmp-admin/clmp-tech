-- =============================================
-- SECURITY FIX: Restrict Public Access to Sensitive Tables
-- =============================================

-- 1. Fix bot_detection_logs - ONLY admins can read
DROP POLICY IF EXISTS "Public read access" ON public.bot_detection_logs;
DROP POLICY IF EXISTS "Anyone can read bot detection logs" ON public.bot_detection_logs;
DROP POLICY IF EXISTS "Authenticated users can view bot logs" ON public.bot_detection_logs;

CREATE POLICY "Only admins can view bot detection logs" 
ON public.bot_detection_logs 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Fix advanced_rate_limits - ONLY admins can read
DROP POLICY IF EXISTS "Public read access" ON public.advanced_rate_limits;
DROP POLICY IF EXISTS "Anyone can read rate limits" ON public.advanced_rate_limits;
DROP POLICY IF EXISTS "Authenticated users can view rate limits" ON public.advanced_rate_limits;

CREATE POLICY "Only admins can view rate limits" 
ON public.advanced_rate_limits 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Ensure profiles table uses the proper restricted policy
-- (We already created this but let's make sure it's the only SELECT policy)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Recreate with proper restrictions (teammates only)
DROP POLICY IF EXISTS "Users can view profiles of project teammates or own" ON public.profiles;
CREATE POLICY "Users can view profiles of project teammates or own" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid()
  OR public.shares_project_with(auth.uid(), user_id)
  OR public.has_role(auth.uid(), 'admin')
);