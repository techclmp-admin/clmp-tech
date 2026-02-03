-- Create support categories table (if not exists)
CREATE TABLE IF NOT EXISTS public.support_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'HelpCircle',
  color TEXT DEFAULT 'blue',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support knowledge base articles table
CREATE TABLE IF NOT EXISTS public.support_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id UUID REFERENCES public.support_categories(id),
  author_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support article ratings table
CREATE TABLE IF NOT EXISTS public.support_article_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.support_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);

-- Create support FAQs table
CREATE TABLE IF NOT EXISTS public.support_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category_id UUID REFERENCES public.support_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support feedback table
CREATE TABLE IF NOT EXISTS public.support_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug_report', 'feature_request', 'general_feedback', 'compliment', 'complaint')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'planned', 'in_progress', 'completed', 'rejected')),
  votes INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support settings table
CREATE TABLE IF NOT EXISTS public.support_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  ticket_updates BOOLEAN DEFAULT true,
  article_updates BOOLEAN DEFAULT false,
  newsletter BOOLEAN DEFAULT true,
  preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'sms', 'in_app')),
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for new tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_categories') THEN
    ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_articles') THEN
    ALTER TABLE public.support_articles ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_article_ratings') THEN
    ALTER TABLE public.support_article_ratings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_faqs') THEN
    ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_feedback') THEN
    ALTER TABLE public.support_feedback ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_settings') THEN
    ALTER TABLE public.support_settings ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create basic RLS policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_categories' AND policyname = 'Anyone can view active support categories') THEN
    EXECUTE 'CREATE POLICY "Anyone can view active support categories" ON public.support_categories FOR SELECT USING (is_active = true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_articles' AND policyname = 'Anyone can view published articles') THEN
    EXECUTE 'CREATE POLICY "Anyone can view published articles" ON public.support_articles FOR SELECT USING (status = ''published'')';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_article_ratings' AND policyname = 'Users can rate articles') THEN
    EXECUTE 'CREATE POLICY "Users can rate articles" ON public.support_article_ratings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_faqs' AND policyname = 'Anyone can view FAQs') THEN
    EXECUTE 'CREATE POLICY "Anyone can view FAQs" ON public.support_faqs FOR SELECT USING (true)';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_feedback' AND policyname = 'Users can create feedback') THEN
    EXECUTE 'CREATE POLICY "Users can create feedback" ON public.support_feedback FOR INSERT WITH CHECK (user_id = auth.uid())';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_feedback' AND policyname = 'Users can view their own feedback') THEN
    EXECUTE 'CREATE POLICY "Users can view their own feedback" ON public.support_feedback FOR SELECT USING (user_id = auth.uid())';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'support_settings' AND policyname = 'Users can manage their own support settings') THEN
    EXECUTE 'CREATE POLICY "Users can manage their own support settings" ON public.support_settings FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())';
  END IF;
END $$;

-- Insert default categories if they don't exist
INSERT INTO public.support_categories (name, description, icon_name, color, sort_order) 
SELECT 'General Support', 'General questions and assistance', 'HelpCircle', 'blue', 1
WHERE NOT EXISTS (SELECT 1 FROM public.support_categories WHERE name = 'General Support');

INSERT INTO public.support_categories (name, description, icon_name, color, sort_order) 
SELECT 'Technical Issues', 'Bug reports and technical problems', 'AlertTriangle', 'red', 2
WHERE NOT EXISTS (SELECT 1 FROM public.support_categories WHERE name = 'Technical Issues');

INSERT INTO public.support_categories (name, description, icon_name, color, sort_order) 
SELECT 'Feature Requests', 'Suggestions for new features', 'Lightbulb', 'yellow', 3
WHERE NOT EXISTS (SELECT 1 FROM public.support_categories WHERE name = 'Feature Requests');

INSERT INTO public.support_categories (name, description, icon_name, color, sort_order) 
SELECT 'Billing & Accounts', 'Payment and account related questions', 'CreditCard', 'green', 4
WHERE NOT EXISTS (SELECT 1 FROM public.support_categories WHERE name = 'Billing & Accounts');

INSERT INTO public.support_categories (name, description, icon_name, color, sort_order) 
SELECT 'Project Management', 'Questions about using project features', 'FolderOpen', 'purple', 5
WHERE NOT EXISTS (SELECT 1 FROM public.support_categories WHERE name = 'Project Management');

INSERT INTO public.support_categories (name, description, icon_name, color, sort_order) 
SELECT 'Integrations', 'Help with third-party integrations', 'ExternalLink', 'orange', 6
WHERE NOT EXISTS (SELECT 1 FROM public.support_categories WHERE name = 'Integrations');

-- Insert sample FAQs
INSERT INTO public.support_faqs (question, answer, category_id, sort_order, is_featured) 
SELECT 'How do I create a new project?', 'To create a new project, go to the Projects page and click the "New Project" button. Fill in the project details and click "Create Project".', sc.id, 1, true
FROM public.support_categories sc
WHERE sc.name = 'Project Management'
AND NOT EXISTS (SELECT 1 FROM public.support_faqs WHERE question = 'How do I create a new project?');

INSERT INTO public.support_faqs (question, answer, category_id, sort_order, is_featured) 
SELECT 'How do I add team members to my project?', 'Navigate to your project and click on the "Team" tab. Then click "Add Member" and enter their email address.', sc.id, 2, true
FROM public.support_categories sc
WHERE sc.name = 'Project Management'
AND NOT EXISTS (SELECT 1 FROM public.support_faqs WHERE question = 'How do I add team members to my project?');

INSERT INTO public.support_faqs (question, answer, category_id, sort_order, is_featured) 
SELECT 'How do I export data to QuickBooks?', 'Go to the Integrations page, connect your QuickBooks account, and then use the export options to sync your data.', sc.id, 1, true
FROM public.support_categories sc
WHERE sc.name = 'Integrations'
AND NOT EXISTS (SELECT 1 FROM public.support_faqs WHERE question = 'How do I export data to QuickBooks?');