-- =============================================
-- ADDITIONAL MISSING TABLES AND FUNCTIONS - PART 4
-- =============================================

-- Add missing columns to team_members
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

-- Add missing columns to chat_rooms
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to permits
ALTER TABLE public.permits 
ADD COLUMN IF NOT EXISTS issuing_authority TEXT;

-- Add missing columns to contact_requests
ALTER TABLE public.contact_requests 
ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'general';

-- Create user_mfa_settings table
CREATE TABLE IF NOT EXISTS public.user_mfa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    phone_number TEXT,
    backup_codes TEXT[],
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their MFA settings" ON public.user_mfa_settings
    FOR ALL USING (user_id = auth.uid());

-- Create global_feature_settings table
CREATE TABLE IF NOT EXISTS public.global_feature_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key TEXT UNIQUE NOT NULL,
    feature_name TEXT NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT true,
    requires_subscription TEXT[],
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.global_feature_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view features" ON public.global_feature_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage features" ON public.global_feature_settings
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create validate_promo_code function
CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_promo public.promo_codes;
    v_result JSONB;
BEGIN
    SELECT * INTO v_promo
    FROM public.promo_codes
    WHERE code = UPPER(p_code)
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= now())
      AND (valid_until IS NULL OR valid_until >= now())
      AND (max_uses IS NULL OR current_uses < max_uses);
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'message', 'Invalid or expired promo code');
    END IF;
    
    RETURN jsonb_build_object(
        'valid', true,
        'code', v_promo.code,
        'discount_percent', v_promo.discount_percent,
        'discount_amount', v_promo.discount_amount
    );
END;
$$;

-- Create transfer_project_ownership function
CREATE OR REPLACE FUNCTION public.transfer_project_ownership(
    p_project_id UUID, 
    p_new_owner_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_owner_id UUID;
BEGIN
    -- Get current owner
    SELECT owner_id INTO v_old_owner_id
    FROM public.projects
    WHERE id = p_project_id;
    
    -- Verify caller is current owner or admin
    IF v_old_owner_id != auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Only the project owner or admin can transfer ownership';
    END IF;
    
    -- Update project owner
    UPDATE public.projects
    SET owner_id = p_new_owner_id, updated_at = now()
    WHERE id = p_project_id;
    
    -- Update old owner's role to admin
    UPDATE public.project_members
    SET role = 'admin'
    WHERE project_id = p_project_id AND user_id = v_old_owner_id;
    
    -- Ensure new owner is in project members with owner role
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (p_project_id, p_new_owner_id, 'owner')
    ON CONFLICT (project_id, user_id) 
    DO UPDATE SET role = 'owner';
    
    -- Log the transfer
    INSERT INTO public.activity_logs (project_id, user_id, action, entity_type, entity_id, details)
    VALUES (p_project_id, auth.uid(), 'transfer_ownership', 'project', p_project_id, 
        jsonb_build_object('old_owner', v_old_owner_id, 'new_owner', p_new_owner_id));
END;
$$;

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    enabled_for_users UUID[],
    enabled_for_roles app_role[],
    percentage_rollout INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view flags" ON public.feature_flags
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage flags" ON public.feature_flags
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create inspection_documents table
CREATE TABLE IF NOT EXISTS public.inspection_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view docs" ON public.inspection_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.inspections i
            JOIN public.project_members pm ON pm.project_id = i.project_id
            WHERE i.id = inspection_documents.inspection_id AND pm.user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage docs" ON public.inspection_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.inspections i
            JOIN public.project_members pm ON pm.project_id = i.project_id
            WHERE i.id = inspection_documents.inspection_id AND pm.user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create inspection_checklist_items table
CREATE TABLE IF NOT EXISTS public.inspection_checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
    item_text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    notes TEXT,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view checklist" ON public.inspection_checklist_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.inspections i
            JOIN public.project_members pm ON pm.project_id = i.project_id
            WHERE i.id = inspection_checklist_items.inspection_id AND pm.user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage checklist" ON public.inspection_checklist_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.inspections i
            JOIN public.project_members pm ON pm.project_id = i.project_id
            WHERE i.id = inspection_checklist_items.inspection_id AND pm.user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    entity_type TEXT,
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Create report_exports table
CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    report_type TEXT NOT NULL,
    format TEXT DEFAULT 'pdf',
    status TEXT DEFAULT 'pending',
    file_url TEXT,
    config JSONB DEFAULT '{}',
    error_message TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their exports" ON public.report_exports
    FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create exports" ON public.report_exports
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.project_tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view comments" ON public.task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_tasks t
            JOIN public.project_members pm ON pm.project_id = t.project_id
            WHERE t.id = task_comments.task_id AND pm.user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can add comments" ON public.task_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.project_tasks t
            JOIN public.project_members pm ON pm.project_id = t.project_id
            WHERE t.id = task_comments.task_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can edit their comments" ON public.task_comments
    FOR UPDATE USING (user_id = auth.uid());

-- Create task_attachments table
CREATE TABLE IF NOT EXISTS public.task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.project_tasks(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view attachments" ON public.task_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_tasks t
            JOIN public.project_members pm ON pm.project_id = t.project_id
            WHERE t.id = task_attachments.task_id AND pm.user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage attachments" ON public.task_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_tasks t
            JOIN public.project_members pm ON pm.project_id = t.project_id
            WHERE t.id = task_attachments.task_id AND pm.user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create time_entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    description TEXT,
    hours NUMERIC NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_billable BOOLEAN DEFAULT true,
    hourly_rate NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project time" ON public.time_entries
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = time_entries.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Users can log their time" ON public.time_entries
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their time" ON public.time_entries
    FOR UPDATE USING (user_id = auth.uid());

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    theme TEXT DEFAULT 'system',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'America/Toronto',
    date_format TEXT DEFAULT 'MM/DD/YYYY',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their settings" ON public.user_settings
    FOR ALL USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;