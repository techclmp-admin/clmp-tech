-- Add missing columns to project_templates
ALTER TABLE public.project_templates ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT false;
ALTER TABLE public.project_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.project_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.project_templates ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(100);
ALTER TABLE public.project_templates ADD COLUMN IF NOT EXISTS estimated_budget DECIMAL(15,2);
ALTER TABLE public.project_templates ADD COLUMN IF NOT EXISTS complexity VARCHAR(50);
ALTER TABLE public.project_templates ADD COLUMN IF NOT EXISTS required_permits TEXT[];

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create support tables
CREATE TABLE IF NOT EXISTS public.support_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_faqs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.support_categories(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    category_id UUID,
    assigned_to UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_articles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category_id UUID,
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_feedback (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    rating INTEGER,
    feedback TEXT,
    page_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on support tables
ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_feedback ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Anyone can view support categories" ON public.support_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view faqs" ON public.support_faqs FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view articles" ON public.support_articles FOR SELECT USING (is_published = true);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can submit feedback" ON public.support_feedback FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);