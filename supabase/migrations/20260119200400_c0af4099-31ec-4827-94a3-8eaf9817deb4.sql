-- =============================================
-- CLMP DATABASE SCHEMA - FULL MIGRATION
-- =============================================

-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. User Roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    company TEXT,
    job_title TEXT,
    member_code TEXT UNIQUE,
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status TEXT DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    budgeted_amount NUMERIC DEFAULT 0,
    actual_amount NUMERIC DEFAULT 0,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 6. Project Members table
CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member',
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 7. Project Tasks table
CREATE TABLE public.project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    start_date DATE,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- 8. Project Files table
CREATE TABLE public.project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- 9. Budgets table
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL,
    budgeted_amount NUMERIC DEFAULT 0,
    actual_amount NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- 10. Project Expenses table
CREATE TABLE public.project_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date DATE,
    category TEXT,
    vendor TEXT,
    receipt_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;

-- 11. Permits table
CREATE TABLE public.permits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    permit_type TEXT NOT NULL,
    permit_number TEXT,
    status TEXT DEFAULT 'pending',
    issued_date DATE,
    expiry_date DATE,
    notes TEXT,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;

-- 12. Inspections table
CREATE TABLE public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    permit_id UUID REFERENCES public.permits(id) ON DELETE SET NULL,
    inspection_type TEXT NOT NULL,
    scheduled_date DATE,
    completed_date DATE,
    status TEXT DEFAULT 'scheduled',
    result TEXT,
    inspector_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- 13. Project Milestones table
CREATE TABLE public.project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    completed_date DATE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- 14. Project Chat Rooms table
CREATE TABLE public.project_chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_chat_rooms ENABLE ROW LEVEL SECURITY;

-- 15. Chat Room Members table
CREATE TABLE public.chat_room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.project_chat_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (room_id, user_id)
);

ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;

-- 16. Chat Messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.project_chat_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    file_url TEXT,
    reply_to UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 17. Message Reactions table
CREATE TABLE public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- 18. Team Members table
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    team_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, team_owner_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 19. Team Invitations table
CREATE TABLE public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'member',
    status TEXT DEFAULT 'pending',
    invitation_token TEXT UNIQUE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- 20. Blocked Members table
CREATE TABLE public.blocked_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT,
    blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);

ALTER TABLE public.blocked_members ENABLE ROW LEVEL SECURITY;

-- 21. Weather Alerts table
CREATE TABLE public.weather_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    alert_type TEXT NOT NULL,
    severity TEXT DEFAULT 'moderate',
    message TEXT,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;

-- 22. Risk Assessments table
CREATE TABLE public.risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    risk_type TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    likelihood TEXT DEFAULT 'medium',
    description TEXT,
    mitigation TEXT,
    status TEXT DEFAULT 'open',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

-- 23. Contact Requests table
CREATE TABLE public.contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    message TEXT,
    status TEXT DEFAULT 'new',
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- 24. Activity Logs table
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 25. Subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan TEXT DEFAULT 'free',
    status TEXT DEFAULT 'active',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 26. Promo Codes table
CREATE TABLE public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER,
    discount_amount NUMERIC,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- 27. Admin Settings table
CREATE TABLE public.admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 28. Sidebar Settings table
CREATE TABLE public.sidebar_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_items JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sidebar_settings ENABLE ROW LEVEL SECURITY;

-- 29. Project Templates table
CREATE TABLE public.project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    template_data JSONB,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- 30. NPS Responses table
CREATE TABLE public.nps_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    score INTEGER NOT NULL,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

-- 31. Alert Dismissals table  
CREATE TABLE public.alert_dismissals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    alert_id UUID NOT NULL,
    dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, alert_id)
);

ALTER TABLE public.alert_dismissals ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- User Roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Project members can view projects" ON public.projects
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = projects.id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Owners and admins can manage projects" ON public.projects
    FOR ALL USING (
        owner_id = auth.uid() OR
        public.has_role(auth.uid(), 'admin')
    );

-- Project Members policies
CREATE POLICY "Members can view project members" ON public.project_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Owners and admins can manage members" ON public.project_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = project_members.project_id AND owner_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Project Tasks policies
CREATE POLICY "Members can view project tasks" ON public.project_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_tasks.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage project tasks" ON public.project_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_tasks.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Project Files policies
CREATE POLICY "Members can view project files" ON public.project_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_files.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage project files" ON public.project_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_files.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Budgets policies
CREATE POLICY "Members can view budgets" ON public.budgets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = budgets.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage budgets" ON public.budgets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = budgets.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Project Expenses policies
CREATE POLICY "Members can view expenses" ON public.project_expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_expenses.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage expenses" ON public.project_expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_expenses.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Permits policies
CREATE POLICY "Members can view permits" ON public.permits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = permits.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage permits" ON public.permits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = permits.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Inspections policies
CREATE POLICY "Members can view inspections" ON public.inspections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = inspections.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage inspections" ON public.inspections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = inspections.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Project Milestones policies
CREATE POLICY "Members can view milestones" ON public.project_milestones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_milestones.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage milestones" ON public.project_milestones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_milestones.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Chat Rooms policies
CREATE POLICY "Members can view chat rooms" ON public.project_chat_rooms
    FOR SELECT USING (
        project_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_chat_rooms.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can create chat rooms" ON public.project_chat_rooms
    FOR INSERT WITH CHECK (
        project_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_chat_rooms.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Chat Room Members policies
CREATE POLICY "Users can view room members" ON public.chat_room_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_room_members crm
            WHERE crm.room_id = chat_room_members.room_id AND crm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join rooms" ON public.chat_room_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Chat Messages policies
CREATE POLICY "Room members can view messages" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_room_members
            WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Room members can send messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.chat_room_members
            WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON public.chat_messages
    FOR UPDATE USING (user_id = auth.uid());

-- Message Reactions policies
CREATE POLICY "Room members can view reactions" ON public.message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_messages cm
            JOIN public.chat_room_members crm ON crm.room_id = cm.room_id
            WHERE cm.id = message_reactions.message_id AND crm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add reactions" ON public.message_reactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their reactions" ON public.message_reactions
    FOR DELETE USING (user_id = auth.uid());

-- Team Members policies
CREATE POLICY "Users can view their team" ON public.team_members
    FOR SELECT USING (user_id = auth.uid() OR team_owner_id = auth.uid());

CREATE POLICY "Team owners can manage team" ON public.team_members
    FOR ALL USING (team_owner_id = auth.uid());

-- Team Invitations policies
CREATE POLICY "Project members can view invitations" ON public.team_invitations
    FOR SELECT USING (
        invited_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = team_invitations.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Project admins can manage invitations" ON public.team_invitations
    FOR ALL USING (
        invited_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = team_invitations.project_id AND owner_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Blocked Members policies
CREATE POLICY "Project admins can view blocked" ON public.blocked_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = blocked_members.project_id AND owner_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Project admins can manage blocked" ON public.blocked_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE id = blocked_members.project_id AND owner_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Weather Alerts policies
CREATE POLICY "Members can view weather alerts" ON public.weather_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = weather_alerts.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "System can manage weather alerts" ON public.weather_alerts
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Risk Assessments policies
CREATE POLICY "Members can view risk assessments" ON public.risk_assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = risk_assessments.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage risk assessments" ON public.risk_assessments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = risk_assessments.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Contact Requests policies (public insert, admin view)
CREATE POLICY "Anyone can submit contact requests" ON public.contact_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view contact requests" ON public.contact_requests
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage contact requests" ON public.contact_requests
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Activity Logs policies
CREATE POLICY "Users can view their activity" ON public.activity_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = activity_logs.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "System can create logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "Users can view their subscription" ON public.subscriptions
    FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their subscription" ON public.subscriptions
    FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their subscription" ON public.subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Promo Codes policies (public view active, admin manage)
CREATE POLICY "Active promo codes viewable" ON public.promo_codes
    FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage promo codes" ON public.promo_codes
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Admin Settings policies
CREATE POLICY "Authenticated users can view settings" ON public.admin_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage settings" ON public.admin_settings
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Sidebar Settings policies
CREATE POLICY "Authenticated users can view sidebar" ON public.sidebar_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage sidebar" ON public.sidebar_settings
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Project Templates policies
CREATE POLICY "Public templates viewable" ON public.project_templates
    FOR SELECT USING (is_public = true OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create templates" ON public.project_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can manage templates" ON public.project_templates
    FOR UPDATE USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- NPS Responses policies
CREATE POLICY "Users can submit NPS" ON public.nps_responses
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can view NPS" ON public.nps_responses
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Alert Dismissals policies
CREATE POLICY "Users can manage their dismissals" ON public.alert_dismissals
    FOR ALL USING (user_id = auth.uid());

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to unblock project member
CREATE OR REPLACE FUNCTION public.unblock_project_member(p_project_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.blocked_members
    WHERE project_id = p_project_id AND user_id = p_user_id;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_permits_updated_at BEFORE UPDATE ON public.permits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.inspections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON public.risk_assessments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();