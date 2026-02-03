-- =============================================
-- FINAL MISSING COLUMNS AND TABLES
-- =============================================

-- Add banned_reason to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned_reason TEXT;

-- Add priority to activity_feed
ALTER TABLE public.activity_feed 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

-- Create safety_incidents table
CREATE TABLE IF NOT EXISTS public.safety_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    incident_date DATE NOT NULL,
    incident_type TEXT NOT NULL,
    severity TEXT DEFAULT 'low',
    description TEXT,
    location TEXT,
    involved_parties JSONB DEFAULT '[]',
    corrective_measures TEXT,
    reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view incidents" ON public.safety_incidents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.project_members WHERE project_id = safety_incidents.project_id AND user_id = auth.uid())
        OR public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage incidents" ON public.safety_incidents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.project_members WHERE project_id = safety_incidents.project_id AND user_id = auth.uid())
        OR public.has_role(auth.uid(), 'admin')
    );

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    channel TEXT DEFAULT 'all',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, notification_type)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their preferences" ON public.notification_preferences
    FOR ALL USING (user_id = auth.uid());