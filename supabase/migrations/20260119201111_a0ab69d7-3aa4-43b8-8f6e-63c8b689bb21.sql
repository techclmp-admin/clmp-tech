-- =============================================
-- ADDITIONAL MISSING COLUMNS - PART 7
-- =============================================

-- Add missing columns to inspections
ALTER TABLE public.inspections 
ADD COLUMN IF NOT EXISTS inspection_date DATE,
ADD COLUMN IF NOT EXISTS phase TEXT,
ADD COLUMN IF NOT EXISTS deficiencies JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS reinspection_date DATE,
ADD COLUMN IF NOT EXISTS next_inspection TEXT,
ADD COLUMN IF NOT EXISTS building_code_section TEXT,
ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]';

-- Add missing columns to permits
ALTER TABLE public.permits
ADD COLUMN IF NOT EXISTS application_date DATE,
ADD COLUMN IF NOT EXISTS fee_amount NUMERIC,
ADD COLUMN IF NOT EXISTS conditions TEXT[],
ADD COLUMN IF NOT EXISTS related_inspections UUID[];

-- Add missing columns to safety_compliance
ALTER TABLE public.safety_compliance
ADD COLUMN IF NOT EXISTS compliance_type TEXT,
ADD COLUMN IF NOT EXISTS regulation_reference TEXT,
ADD COLUMN IF NOT EXISTS evidence_url TEXT,
ADD COLUMN IF NOT EXISTS audited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS audit_date DATE;

-- Add missing columns to obc_compliance_items
ALTER TABLE public.obc_compliance_items
ADD COLUMN IF NOT EXISTS requirement TEXT,
ADD COLUMN IF NOT EXISTS division TEXT,
ADD COLUMN IF NOT EXISTS article TEXT,
ADD COLUMN IF NOT EXISTS compliance_method TEXT,
ADD COLUMN IF NOT EXISTS evidence_urls TEXT[];

-- Create project_photos table
CREATE TABLE IF NOT EXISTS public.project_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT,
    description TEXT,
    category TEXT,
    taken_at TIMESTAMP WITH TIME ZONE,
    location TEXT,
    tags TEXT[],
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view photos" ON public.project_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_photos.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage photos" ON public.project_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_photos.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create punch_list_items table
CREATE TABLE IF NOT EXISTS public.punch_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    photos JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.punch_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view punch list" ON public.punch_list_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = punch_list_items.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage punch list" ON public.punch_list_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = punch_list_items.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create project_schedule table
CREATE TABLE IF NOT EXISTS public.project_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    task_name TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER,
    progress INTEGER DEFAULT 0,
    dependencies UUID[],
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'not_started',
    milestone BOOLEAN DEFAULT false,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view schedule" ON public.project_schedule
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_schedule.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage schedule" ON public.project_schedule
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_schedule.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create rfi_items table (Request for Information)
CREATE TABLE IF NOT EXISTS public.rfi_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    rfi_number TEXT,
    subject TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date DATE,
    response TEXT,
    responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rfi_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view RFIs" ON public.rfi_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = rfi_items.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage RFIs" ON public.rfi_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = rfi_items.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create submittals table
CREATE TABLE IF NOT EXISTS public.submittals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    submittal_number TEXT,
    title TEXT NOT NULL,
    description TEXT,
    specification_section TEXT,
    status TEXT DEFAULT 'pending',
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_status TEXT,
    review_comments TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.submittals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view submittals" ON public.submittals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = submittals.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage submittals" ON public.submittals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = submittals.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create meeting_minutes table
CREATE TABLE IF NOT EXISTS public.meeting_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    location TEXT,
    attendees JSONB DEFAULT '[]',
    agenda TEXT,
    notes TEXT,
    action_items JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view meetings" ON public.meeting_minutes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = meeting_minutes.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage meetings" ON public.meeting_minutes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = meeting_minutes.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create drawing_revisions table
CREATE TABLE IF NOT EXISTS public.drawing_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    drawing_number TEXT NOT NULL,
    title TEXT NOT NULL,
    revision_number TEXT,
    description TEXT,
    discipline TEXT,
    scale TEXT,
    file_path TEXT,
    status TEXT DEFAULT 'current',
    issued_date DATE,
    issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.drawing_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view drawings" ON public.drawing_revisions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = drawing_revisions.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage drawings" ON public.drawing_revisions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = drawing_revisions.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Add description column to admin_settings
ALTER TABLE public.admin_settings
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create weather_forecast table
CREATE TABLE IF NOT EXISTS public.weather_forecast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    forecast_date DATE NOT NULL,
    temperature_high NUMERIC,
    temperature_low NUMERIC,
    conditions TEXT,
    precipitation_chance INTEGER,
    wind_speed NUMERIC,
    humidity INTEGER,
    uv_index INTEGER,
    work_impact TEXT,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (project_id, forecast_date)
);

ALTER TABLE public.weather_forecast ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view forecast" ON public.weather_forecast
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = weather_forecast.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "System can manage forecast" ON public.weather_forecast
    FOR ALL USING (true);