-- Security Hardening Migration
-- Fix RLS policies for sensitive tables to prevent unauthorized access

-- =====================================================
-- 1. BOT_DETECTION_LOGS - Admin only access
-- =====================================================
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can read bot detection logs" ON public.bot_detection_logs;
DROP POLICY IF EXISTS "System can insert bot detection logs" ON public.bot_detection_logs;
DROP POLICY IF EXISTS "bot_detection_read_access" ON public.bot_detection_logs;
DROP POLICY IF EXISTS "bot_detection_insert_access" ON public.bot_detection_logs;

-- Create admin-only read policy
CREATE POLICY "Only admins can read bot detection logs"
ON public.bot_detection_logs
FOR SELECT
USING (public.is_any_admin(auth.uid()));

-- Service role insert via SECURITY DEFINER function only (no direct insert)
-- Edge functions use service role key which bypasses RLS

-- =====================================================
-- 2. ADVANCED_RATE_LIMITS - Admin only access
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read rate limits" ON public.advanced_rate_limits;
DROP POLICY IF EXISTS "System can manage rate limits" ON public.advanced_rate_limits;
DROP POLICY IF EXISTS "rate_limits_read_access" ON public.advanced_rate_limits;
DROP POLICY IF EXISTS "rate_limits_insert_access" ON public.advanced_rate_limits;
DROP POLICY IF EXISTS "rate_limits_update_access" ON public.advanced_rate_limits;

-- Create admin-only read policy
CREATE POLICY "Only admins can read rate limits"
ON public.advanced_rate_limits
FOR SELECT
USING (public.is_any_admin(auth.uid()));

-- =====================================================
-- 3. AUDIT_LOGS - Admin read, service-only insert
-- =====================================================
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_read_access" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_access" ON public.audit_logs;

-- Only admins can read audit logs
CREATE POLICY "Only admins can read audit logs"
ON public.audit_logs
FOR SELECT
USING (public.is_any_admin(auth.uid()));

-- No direct insert policy - use SECURITY DEFINER function for controlled inserts

-- =====================================================
-- 4. PROJECT_CHAT_ROOMS - Participant only access
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read chat rooms" ON public.project_chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can view chat rooms" ON public.project_chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_read_access" ON public.project_chat_rooms;

-- Only participants can see their chat rooms
CREATE POLICY "Participants can view their chat rooms"
ON public.project_chat_rooms
FOR SELECT
USING (
  public.is_chat_room_participant(id, auth.uid())
  OR public.is_chat_room_member(id, auth.uid())
  OR (project_id IS NOT NULL AND public.is_project_member(project_id, auth.uid()))
  OR created_by = auth.uid()
  OR public.is_any_admin(auth.uid())
);

-- =====================================================
-- 5. PROFILES - Restrict sensitive field access
-- =====================================================
-- Create a secure view for basic profile info (name, avatar only)
CREATE OR REPLACE VIEW public.profiles_basic AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  member_code
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_basic TO authenticated;
GRANT SELECT ON public.profiles_basic TO anon;

-- Drop overly permissive profile policies
DROP POLICY IF EXISTS "Project teammates can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can view any profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_access" ON public.profiles;

-- Users can view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Project members can view basic teammate profiles (limited fields via application)
CREATE POLICY "Project members can view teammate profiles"
ON public.profiles
FOR SELECT
USING (
  public.shares_project_with(auth.uid(), user_id)
  OR public.is_any_admin(auth.uid())
);

-- Ensure users can update only their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);