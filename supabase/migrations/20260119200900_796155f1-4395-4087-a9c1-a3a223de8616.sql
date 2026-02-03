-- =============================================
-- ADDITIONAL MISSING TABLES AND FUNCTIONS - PART 5
-- =============================================

-- Add missing columns to global_feature_settings
ALTER TABLE public.global_feature_settings 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS show_as_upcoming BOOLEAN DEFAULT false;

-- Add missing columns to promo_codes
ALTER TABLE public.promo_codes 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percent',
ADD COLUMN IF NOT EXISTS discount_value NUMERIC,
ADD COLUMN IF NOT EXISTS applicable_plans TEXT[];

-- Add missing columns to profiles for subscription tracking
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE;

-- Create global_sidebar_settings table
CREATE TABLE IF NOT EXISTS public.global_sidebar_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    display_name TEXT,
    menu_order INTEGER DEFAULT 0,
    show_as_upcoming BOOLEAN DEFAULT false,
    icon TEXT,
    path TEXT,
    required_roles TEXT[],
    required_subscription TEXT[],
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.global_sidebar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sidebar settings" ON public.global_sidebar_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage sidebar settings" ON public.global_sidebar_settings
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create project_invoices table
CREATE TABLE IF NOT EXISTS public.project_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT,
    client_name TEXT,
    client_email TEXT,
    amount NUMERIC NOT NULL,
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'draft',
    due_date DATE,
    paid_date DATE,
    notes TEXT,
    line_items JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invoices" ON public.project_invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_invoices.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage invoices" ON public.project_invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_invoices.project_id 
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin', 'manager')
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create project_documents table
CREATE TABLE IF NOT EXISTS public.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size BIGINT,
    category TEXT,
    version INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view documents" ON public.project_documents
    FOR SELECT USING (
        is_public = true OR
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_documents.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage documents" ON public.project_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = project_documents.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create daily_reports table
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weather_conditions TEXT,
    temperature NUMERIC,
    work_performed TEXT,
    materials_used JSONB DEFAULT '[]',
    equipment_used JSONB DEFAULT '[]',
    workforce_count INTEGER,
    safety_incidents TEXT,
    delays TEXT,
    notes TEXT,
    photos JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view daily reports" ON public.daily_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = daily_reports.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage daily reports" ON public.daily_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = daily_reports.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create change_orders table
CREATE TABLE IF NOT EXISTS public.change_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    order_number TEXT,
    title TEXT NOT NULL,
    description TEXT,
    reason TEXT,
    amount NUMERIC,
    status TEXT DEFAULT 'pending',
    requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    effective_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view change orders" ON public.change_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = change_orders.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage change orders" ON public.change_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = change_orders.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create subcontractors table
CREATE TABLE IF NOT EXISTS public.subcontractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    trade TEXT,
    license_number TEXT,
    insurance_expiry DATE,
    contract_amount NUMERIC,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view subcontractors" ON public.subcontractors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = subcontractors.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage subcontractors" ON public.subcontractors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = subcontractors.project_id 
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin', 'manager')
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create equipment_tracking table
CREATE TABLE IF NOT EXISTS public.equipment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    equipment_name TEXT NOT NULL,
    equipment_type TEXT,
    serial_number TEXT,
    status TEXT DEFAULT 'available',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    location TEXT,
    last_maintenance DATE,
    next_maintenance DATE,
    hourly_rate NUMERIC,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view equipment" ON public.equipment_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = equipment_tracking.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage equipment" ON public.equipment_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = equipment_tracking.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create materials_inventory table
CREATE TABLE IF NOT EXISTS public.materials_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    material_name TEXT NOT NULL,
    description TEXT,
    unit TEXT,
    quantity NUMERIC DEFAULT 0,
    unit_cost NUMERIC,
    supplier TEXT,
    location TEXT,
    reorder_level NUMERIC,
    last_ordered DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.materials_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view materials" ON public.materials_inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = materials_inventory.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Members can manage materials" ON public.materials_inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_id = materials_inventory.project_id AND user_id = auth.uid()
        ) OR
        public.has_role(auth.uid(), 'admin')
    );

-- Create weather_data table for caching
CREATE TABLE IF NOT EXISTS public.weather_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    temperature NUMERIC,
    feels_like NUMERIC,
    humidity INTEGER,
    wind_speed NUMERIC,
    conditions TEXT,
    icon TEXT,
    forecast JSONB DEFAULT '[]',
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (location)
);

ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view weather" ON public.weather_data
    FOR SELECT USING (true);

CREATE POLICY "System can manage weather" ON public.weather_data
    FOR ALL USING (true);

-- Add missing columns to projects for budget field
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS budget NUMERIC;

-- Update budget to match budgeted_amount
UPDATE public.projects SET budget = budgeted_amount WHERE budget IS NULL;