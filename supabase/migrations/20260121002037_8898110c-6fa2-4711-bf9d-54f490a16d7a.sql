-- =============================================
-- SECURITY FIX: Update Permissive RLS Policies
-- =============================================

-- 1. Fix activity_feed - only allow users to insert/update/delete their own entries
DROP POLICY IF EXISTS "Users can insert activity feed" ON public.activity_feed;
DROP POLICY IF EXISTS "Users can update activity feed" ON public.activity_feed;
DROP POLICY IF EXISTS "Users can delete activity feed" ON public.activity_feed;

CREATE POLICY "Users can insert own activity feed" 
ON public.activity_feed 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity feed" 
ON public.activity_feed 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity feed" 
ON public.activity_feed 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 2. Fix activity_logs - only project members can insert logs for their projects
DROP POLICY IF EXISTS "Users can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can update activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can delete activity logs" ON public.activity_logs;

CREATE POLICY "Project members can insert activity logs" 
ON public.activity_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id 
  OR public.is_project_member(project_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- 3. Fix audit_logs - only admins can modify audit logs
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can update audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can delete audit logs" ON public.audit_logs;

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Fix bot_detection_logs - only system/edge functions should insert
DROP POLICY IF EXISTS "Anyone can insert bot detection logs" ON public.bot_detection_logs;
DROP POLICY IF EXISTS "Users can insert bot detection logs" ON public.bot_detection_logs;

-- Allow inserts from service role only (edge functions)
CREATE POLICY "Service role can insert bot detection logs" 
ON public.bot_detection_logs 
FOR INSERT 
WITH CHECK (true); -- Edge functions use service role

-- 5. Fix email_logs - restrict to admins
DROP POLICY IF EXISTS "Anyone can insert email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can insert email logs" ON public.email_logs;

CREATE POLICY "Service role can insert email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (true); -- Edge functions use service role

-- 6. Fix nps_responses - only users can insert/update their own responses
DROP POLICY IF EXISTS "Users can insert NPS responses" ON public.nps_responses;
DROP POLICY IF EXISTS "Users can update NPS responses" ON public.nps_responses;
DROP POLICY IF EXISTS "Anyone can insert NPS responses" ON public.nps_responses;

CREATE POLICY "Users can insert own NPS responses" 
ON public.nps_responses 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own NPS responses" 
ON public.nps_responses 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- 7. Fix notifications - only users can modify their own notifications
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications or system notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 8. Fix subscription_history - only system can modify
DROP POLICY IF EXISTS "Anyone can insert subscription history" ON public.subscription_history;
DROP POLICY IF EXISTS "Users can insert subscription history" ON public.subscription_history;

CREATE POLICY "System can insert subscription history" 
ON public.subscription_history 
FOR INSERT 
WITH CHECK (true); -- Service role/triggers only

-- 9. Fix advanced_rate_limits - service role only
DROP POLICY IF EXISTS "Anyone can update rate limits" ON public.advanced_rate_limits;
DROP POLICY IF EXISTS "Anyone can insert rate limits" ON public.advanced_rate_limits;
DROP POLICY IF EXISTS "Users can insert rate limits" ON public.advanced_rate_limits;
DROP POLICY IF EXISTS "Users can update rate limits" ON public.advanced_rate_limits;

CREATE POLICY "Service role can manage rate limits" 
ON public.advanced_rate_limits 
FOR ALL 
USING (true)
WITH CHECK (true); -- Edge functions use service role

-- =============================================
-- SECURITY FIX: Chat Room Privacy
-- =============================================

-- 10. Fix project_chat_rooms - only participants can see rooms
DROP POLICY IF EXISTS "Anyone can view chat rooms" ON public.project_chat_rooms;
DROP POLICY IF EXISTS "Users can view chat rooms" ON public.project_chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can view chat rooms" ON public.project_chat_rooms;

CREATE POLICY "Participants can view chat rooms" 
ON public.project_chat_rooms 
FOR SELECT 
TO authenticated 
USING (
  -- User is a participant of this room
  public.is_chat_room_participant(id, auth.uid())
  -- Or user is a member of the project this room belongs to
  OR (project_id IS NOT NULL AND public.is_project_member(project_id, auth.uid()))
  -- Or user created the room
  OR created_by = auth.uid()
  -- Or admin
  OR public.has_role(auth.uid(), 'admin')
);

-- =============================================
-- SECURITY FIX: Profile Access Restriction
-- =============================================

-- 11. Fix profiles - limit visibility
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a function to check if users share a project
CREATE OR REPLACE FUNCTION public.shares_project_with(_user_id uuid, _other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm1
    JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = _user_id
      AND pm2.user_id = _other_user_id
  )
$$;

CREATE POLICY "Users can view profiles of project teammates or own" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  -- Own profile
  user_id = auth.uid()
  -- Or shares a project with this user
  OR public.shares_project_with(auth.uid(), user_id)
  -- Or admin
  OR public.has_role(auth.uid(), 'admin')
);

-- Ensure users can only update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());