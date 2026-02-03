-- =============================================
-- ADDITIONAL MISSING FUNCTIONS AND TABLES - PART 6
-- =============================================

-- Add missing columns to global_sidebar_settings
ALTER TABLE public.global_sidebar_settings 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add missing columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE;

-- Add chat_room_id to chat_messages (for SimpleChat compatibility)
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS chat_room_id UUID REFERENCES public.project_chat_rooms(id) ON DELETE CASCADE;

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    old_plan TEXT,
    new_plan TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    change_reason TEXT,
    metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their history" ON public.subscription_history
    FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create history" ON public.subscription_history
    FOR INSERT WITH CHECK (true);

-- Create extend_trial function
CREATE OR REPLACE FUNCTION public.extend_trial(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.subscriptions
    SET trial_ends_at = COALESCE(trial_ends_at, now()) + (p_days || ' days')::interval,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Log the extension
    INSERT INTO public.subscription_history (user_id, old_plan, new_plan, change_reason)
    VALUES (p_user_id, 'trial', 'trial', 'Trial extended by ' || p_days || ' days');
END;
$$;

-- Create admin_get_orphan_auth_users function
CREATE OR REPLACE FUNCTION public.admin_get_orphan_auth_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow admins
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    RETURN QUERY
    SELECT au.id, au.email::TEXT, au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE p.id IS NULL;
END;
$$;

-- Create ban_user function
CREATE OR REPLACE FUNCTION public.ban_user(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow admins
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    UPDATE public.profiles
    SET is_banned = true, updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Log the action
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (auth.uid(), 'ban_user', 'user', p_user_id, jsonb_build_object('reason', p_reason));
END;
$$;

-- Create unban_user function
CREATE OR REPLACE FUNCTION public.unban_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow admins
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    UPDATE public.profiles
    SET is_banned = false, updated_at = now()
    WHERE user_id = p_user_id;
    
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id)
    VALUES (auth.uid(), 'unban_user', 'user', p_user_id);
END;
$$;

-- Create admin_delete_orphan_profile function
CREATE OR REPLACE FUNCTION public.admin_delete_orphan_profile(p_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    DELETE FROM public.profiles WHERE id = p_profile_id;
END;
$$;

-- Create create_chat_room function
CREATE OR REPLACE FUNCTION public.create_chat_room(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_is_private BOOLEAN DEFAULT false,
    p_room_type TEXT DEFAULT 'group'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room_id UUID;
BEGIN
    INSERT INTO public.chat_rooms (name, description, project_id, is_private, room_type, created_by)
    VALUES (p_name, p_description, p_project_id, p_is_private, p_room_type, auth.uid())
    RETURNING id INTO v_room_id;
    
    -- Add creator as participant
    INSERT INTO public.chat_participants (chat_room_id, user_id, role)
    VALUES (v_room_id, auth.uid(), 'admin');
    
    RETURN v_room_id;
END;
$$;

-- Create get_user_subscription function
CREATE OR REPLACE FUNCTION public.get_user_subscription(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_subscription RECORD;
    v_result JSONB;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    
    SELECT * INTO v_subscription
    FROM public.subscriptions
    WHERE user_id = v_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'plan', 'free',
            'status', 'active',
            'has_subscription', false
        );
    END IF;
    
    RETURN jsonb_build_object(
        'id', v_subscription.id,
        'plan', v_subscription.plan,
        'status', v_subscription.status,
        'trial_ends_at', v_subscription.trial_ends_at,
        'current_period_end', v_subscription.current_period_end,
        'has_subscription', true
    );
END;
$$;

-- Create check_feature_access function
CREATE OR REPLACE FUNCTION public.check_feature_access(p_feature_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_feature RECORD;
    v_user_subscription TEXT;
BEGIN
    SELECT * INTO v_feature
    FROM public.global_feature_settings
    WHERE feature_key = p_feature_key AND is_enabled = true;
    
    IF NOT FOUND OR NOT v_feature.enabled THEN
        RETURN false;
    END IF;
    
    -- Check if requires subscription
    IF v_feature.requires_subscription IS NOT NULL AND array_length(v_feature.requires_subscription, 1) > 0 THEN
        SELECT plan INTO v_user_subscription
        FROM public.subscriptions
        WHERE user_id = auth.uid();
        
        IF v_user_subscription IS NULL OR NOT (v_user_subscription = ANY(v_feature.requires_subscription)) THEN
            -- Check for admin access
            IF NOT public.has_role(auth.uid(), 'admin') THEN
                RETURN false;
            END IF;
        END IF;
    END IF;
    
    RETURN true;
END;
$$;

-- Create update_message function for chat
CREATE OR REPLACE FUNCTION public.update_message(
    p_message_id UUID,
    p_content TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.chat_messages
    SET content = p_content, is_edited = true, updated_at = now()
    WHERE id = p_message_id AND user_id = auth.uid();
END;
$$;

-- Create delete_message function for chat
CREATE OR REPLACE FUNCTION public.delete_message(p_message_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.chat_messages
    WHERE id = p_message_id AND user_id = auth.uid();
END;
$$;

-- Create add_reaction function
CREATE OR REPLACE FUNCTION public.add_reaction(
    p_message_id UUID,
    p_emoji TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.message_reactions (message_id, user_id, emoji)
    VALUES (p_message_id, auth.uid(), p_emoji)
    ON CONFLICT (message_id, user_id, emoji) DO NOTHING;
END;
$$;

-- Create remove_reaction function
CREATE OR REPLACE FUNCTION public.remove_reaction(
    p_message_id UUID,
    p_emoji TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.message_reactions
    WHERE message_id = p_message_id 
      AND user_id = auth.uid() 
      AND emoji = p_emoji;
END;
$$;

-- Create leave_chat_room function
CREATE OR REPLACE FUNCTION public.leave_chat_room(p_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.chat_participants
    WHERE chat_room_id = p_room_id AND user_id = auth.uid();
    
    DELETE FROM public.chat_room_members
    WHERE room_id = p_room_id AND user_id = auth.uid();
END;
$$;

-- Create update_room_settings function
CREATE OR REPLACE FUNCTION public.update_room_settings(
    p_room_id UUID,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_is_private BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.chat_rooms
    SET 
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        is_private = COALESCE(p_is_private, is_private),
        updated_at = now()
    WHERE id = p_room_id 
      AND (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
END;
$$;

-- Create get_room_members function
CREATE OR REPLACE FUNCTION public.get_room_members(p_room_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT,
    joined_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.user_id,
        p.full_name,
        p.email,
        p.avatar_url,
        cp.role,
        cp.joined_at
    FROM public.chat_participants cp
    JOIN public.profiles p ON p.user_id = cp.user_id
    WHERE cp.chat_room_id = p_room_id;
END;
$$;

-- Create delete_task function
CREATE OR REPLACE FUNCTION public.delete_task(p_task_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.project_tasks
    WHERE id = p_task_id
      AND EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = project_tasks.project_id
            AND pm.user_id = auth.uid()
      );
END;
$$;