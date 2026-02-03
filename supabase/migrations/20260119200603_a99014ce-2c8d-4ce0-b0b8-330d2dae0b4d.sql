-- =============================================
-- MORE MISSING TABLES AND COLUMNS FOR CLMP
-- =============================================

-- Add missing columns to risk_assessments
ALTER TABLE public.risk_assessments 
ADD COLUMN IF NOT EXISTS weather_conditions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;

-- Add missing columns to team_members
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add missing column to quickbooks_integrations
ALTER TABLE public.quickbooks_integrations 
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- Create project_activity_log table
CREATE TABLE IF NOT EXISTS public.project_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view activity" ON public.project_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_activity_log.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "System can create activity" ON public.project_activity_log
    FOR INSERT WITH CHECK (true);

-- Create chat_participants table
CREATE TABLE IF NOT EXISTS public.chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id UUID REFERENCES public.project_chat_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member',
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_muted BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (chat_room_id, user_id)
);

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view" ON public.chat_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.chat_participants cp
            WHERE cp.chat_room_id = chat_participants.chat_room_id AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join rooms" ON public.chat_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their participation" ON public.chat_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Create chat_rooms table (different from project_chat_rooms)
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    room_type TEXT DEFAULT 'group',
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view rooms" ON public.chat_rooms
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE chat_room_id = chat_rooms.id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Users can create rooms" ON public.chat_rooms
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Creators can update rooms" ON public.chat_rooms
    FOR UPDATE USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Add missing columns to project_files
ALTER TABLE public.project_files 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Create activity_feed table
CREATE TABLE IF NOT EXISTS public.activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    title TEXT,
    description TEXT,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their feed" ON public.activity_feed
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = activity_feed.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "System can create feed items" ON public.activity_feed
    FOR INSERT WITH CHECK (true);

-- Create obc_compliance_items table (Ontario Building Code)
CREATE TABLE IF NOT EXISTS public.obc_compliance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    code_section TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    document_url TEXT,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.obc_compliance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view OBC items" ON public.obc_compliance_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = obc_compliance_items.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage OBC items" ON public.obc_compliance_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = obc_compliance_items.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create safety_compliance table
CREATE TABLE IF NOT EXISTS public.safety_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view safety items" ON public.safety_compliance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = safety_compliance.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage safety items" ON public.safety_compliance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = safety_compliance.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Add chat_room_id to activity_logs if it doesn't exist
ALTER TABLE public.activity_logs 
ADD COLUMN IF NOT EXISTS chat_room_id UUID REFERENCES public.project_chat_rooms(id) ON DELETE SET NULL;

-- Create start_trial function
CREATE OR REPLACE FUNCTION public.start_trial(p_user_id UUID, p_trial_days INTEGER DEFAULT 14)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
    VALUES (p_user_id, 'trial', 'trialing', now() + (p_trial_days || ' days')::interval)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        plan = 'trial',
        status = 'trialing',
        trial_ends_at = now() + (p_trial_days || ' days')::interval,
        updated_at = now();
END;
$$;

-- Add room_type to project_chat_rooms
ALTER TABLE public.project_chat_rooms 
ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'project',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create simple_chat_messages table for SimpleChat component
CREATE TABLE IF NOT EXISTS public.simple_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.simple_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view messages" ON public.simple_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = simple_chat_messages.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can send messages" ON public.simple_chat_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = simple_chat_messages.project_id AND user_id = auth.uid()
        )
    );

-- Enable realtime for more tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.simple_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_activity_log;