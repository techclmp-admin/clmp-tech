-- =============================================
-- ADDITIONAL COLUMNS AND FUNCTIONS FOR CLMP
-- =============================================

-- Add missing columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add missing columns to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add missing columns to project_members
ALTER TABLE public.project_members 
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add missing columns to budgets
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS spent_amount NUMERIC DEFAULT 0;

-- Add missing columns to project_tasks
ALTER TABLE public.project_tasks 
ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC,
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add missing columns to risk_assessments
ALTER TABLE public.risk_assessments 
ADD COLUMN IF NOT EXISTS risk_score INTEGER,
ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS mitigation_strategies JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS ai_recommendations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS impact TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add missing columns to weather_alerts
ALTER TABLE public.weather_alerts 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
ADD COLUMN IF NOT EXISTS recommended_actions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create role_changes table
CREATE TABLE IF NOT EXISTS public.role_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    old_role TEXT,
    new_role TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.role_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view role changes" ON public.role_changes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = role_changes.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Admins can manage role changes" ON public.role_changes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = role_changes.project_id AND owner_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create remove_project_member function
CREATE OR REPLACE FUNCTION public.remove_project_member(p_project_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.project_members
    WHERE project_id = p_project_id AND user_id = p_user_id;
END;
$$;

-- Create block_project_member function
CREATE OR REPLACE FUNCTION public.block_project_member(
    p_project_id UUID, 
    p_user_id UUID, 
    p_blocked_by UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Remove from project members first
    DELETE FROM public.project_members
    WHERE project_id = p_project_id AND user_id = p_user_id;
    
    -- Add to blocked members
    INSERT INTO public.blocked_members (project_id, user_id, blocked_by, reason)
    VALUES (p_project_id, p_user_id, p_blocked_by, p_reason)
    ON CONFLICT (project_id, user_id) DO NOTHING;
END;
$$;

-- Create rejoin_requests table
CREATE TABLE IF NOT EXISTS public.rejoin_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending',
    message TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);

ALTER TABLE public.rejoin_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their rejoin requests" ON public.rejoin_requests
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = rejoin_requests.project_id AND owner_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Users can create rejoin requests" ON public.rejoin_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Project owners can manage rejoin requests" ON public.rejoin_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = rejoin_requests.project_id AND owner_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create user_presence table for real-time
CREATE TABLE IF NOT EXISTS public.user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    status TEXT DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    current_room_id UUID REFERENCES public.project_chat_rooms(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view presence" ON public.user_presence
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their presence" ON public.user_presence
    FOR ALL USING (user_id = auth.uid());

-- Create contacts table for direct messaging
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    contact_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nickname TEXT,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, contact_id)
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their contacts" ON public.contacts
    FOR SELECT USING (user_id = auth.uid() OR contact_id = auth.uid());

CREATE POLICY "Users can manage their contacts" ON public.contacts
    FOR ALL USING (user_id = auth.uid());

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON public.direct_messages
    FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.direct_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Create audit_logs table for admin
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Create bot_detection_logs table
CREATE TABLE IF NOT EXISTS public.bot_detection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    path TEXT,
    bot_score INTEGER,
    detection_reasons TEXT[],
    is_bot BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    behavioral_data JSONB,
    block_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_detection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view bot logs" ON public.bot_detection_logs
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage bot logs" ON public.bot_detection_logs
    FOR ALL USING (true);

-- Create advanced_rate_limits table
CREATE TABLE IF NOT EXISTS public.advanced_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    identifier_type TEXT DEFAULT 'ip',
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_blocked BOOLEAN DEFAULT false,
    consecutive_violations INTEGER DEFAULT 0,
    total_violations INTEGER DEFAULT 0,
    block_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (identifier, identifier_type)
);

ALTER TABLE public.advanced_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage rate limits" ON public.advanced_rate_limits
    FOR ALL USING (true);

-- Create QuickBooks integration tables
CREATE TABLE IF NOT EXISTS public.quickbooks_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id TEXT,
    company_name TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    "realmId" TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quickbooks_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their integrations" ON public.quickbooks_integrations
    FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.quickbooks_export_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES public.quickbooks_integrations(id) ON DELETE CASCADE NOT NULL,
    auto_sync_enabled BOOLEAN DEFAULT false,
    sync_frequency TEXT DEFAULT 'manual',
    export_customers BOOLEAN DEFAULT true,
    export_invoices BOOLEAN DEFAULT true,
    export_expenses BOOLEAN DEFAULT true,
    export_payments BOOLEAN DEFAULT true,
    export_projects_as_customers BOOLEAN DEFAULT true,
    default_expense_account_ref TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quickbooks_export_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their export settings" ON public.quickbooks_export_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quickbooks_integrations
            WHERE id = quickbooks_export_settings.integration_id AND user_id = auth.uid()
        )
    );

CREATE TABLE IF NOT EXISTS public.quickbooks_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES public.quickbooks_integrations(id) ON DELETE CASCADE NOT NULL,
    sync_type TEXT,
    direction TEXT DEFAULT 'export',
    status TEXT DEFAULT 'pending',
    records_processed INTEGER DEFAULT 0,
    records_success INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quickbooks_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sync logs" ON public.quickbooks_sync_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quickbooks_integrations
            WHERE id = quickbooks_sync_logs.integration_id AND user_id = auth.uid()
        )
    );

CREATE TABLE IF NOT EXISTS public.quickbooks_export_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES public.quickbooks_integrations(id) ON DELETE CASCADE NOT NULL,
    local_entity_type TEXT NOT NULL,
    local_entity_id UUID NOT NULL,
    quickbooks_entity_type TEXT NOT NULL,
    quickbooks_entity_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (integration_id, local_entity_type, local_entity_id)
);

ALTER TABLE public.quickbooks_export_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their mappings" ON public.quickbooks_export_mappings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quickbooks_integrations
            WHERE id = quickbooks_export_mappings.integration_id AND user_id = auth.uid()
        )
    );

-- Enable realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;