-- Create support categories table
CREATE TABLE public.support_categories (
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

-- Create support tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.support_categories(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed')),
  assigned_to UUID,
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support ticket messages table
CREATE TABLE public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support knowledge base articles table
CREATE TABLE public.support_articles (
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
CREATE TABLE public.support_article_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.support_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);

-- Create support FAQs table
CREATE TABLE public.support_faqs (
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
CREATE TABLE public.support_feedback (
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
CREATE TABLE public.support_settings (
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

-- Enable RLS
ALTER TABLE public.support_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_article_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active support categories" 
ON public.support_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can view their own support tickets" 
ON public.support_tickets 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own support tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own open support tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (user_id = auth.uid() AND status IN ('open', 'waiting_for_user'));

CREATE POLICY "Users can view messages from their tickets" 
ON public.support_ticket_messages 
FOR SELECT 
USING (
  ticket_id IN (
    SELECT id FROM public.support_tickets 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages on their tickets" 
ON public.support_ticket_messages 
FOR INSERT 
WITH CHECK (
  ticket_id IN (
    SELECT id FROM public.support_tickets 
    WHERE user_id = auth.uid()
  ) AND user_id = auth.uid()
);

CREATE POLICY "Anyone can view published articles" 
ON public.support_articles 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Users can rate articles" 
ON public.support_article_ratings 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view FAQs" 
ON public.support_faqs 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create feedback" 
ON public.support_feedback 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own feedback" 
ON public.support_feedback 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own support settings" 
ON public.support_settings 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Support admin policies (for users with support role)
CREATE POLICY "Support staff can manage all tickets" 
ON public.support_tickets 
FOR ALL 
USING (has_role_tag(auth.uid(), 'support_admin'::role_tag));

CREATE POLICY "Support staff can manage all ticket messages" 
ON public.support_ticket_messages 
FOR ALL 
USING (has_role_tag(auth.uid(), 'support_admin'::role_tag));

CREATE POLICY "Support staff can manage articles" 
ON public.support_articles 
FOR ALL 
USING (has_role_tag(auth.uid(), 'support_admin'::role_tag));

CREATE POLICY "Support staff can manage categories" 
ON public.support_categories 
FOR ALL 
USING (has_role_tag(auth.uid(), 'support_admin'::role_tag));

CREATE POLICY "Support staff can manage FAQs" 
ON public.support_faqs 
FOR ALL 
USING (has_role_tag(auth.uid(), 'support_admin'::role_tag));

CREATE POLICY "Support staff can view all feedback" 
ON public.support_feedback 
FOR ALL 
USING (has_role_tag(auth.uid(), 'support_admin'::role_tag));

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS support_ticket_sequence START 1000;

-- Create functions
CREATE OR REPLACE FUNCTION public.generate_support_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN 'SUP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('support_ticket_sequence')::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_support_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_support_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_support_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_article_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.support_articles 
  SET view_count = view_count + 1 
  WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER set_support_ticket_number_trigger
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_support_ticket_number();

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_support_updated_at();

CREATE TRIGGER update_support_articles_updated_at
BEFORE UPDATE ON public.support_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_support_updated_at();

CREATE TRIGGER update_support_faqs_updated_at
BEFORE UPDATE ON public.support_faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_support_updated_at();

CREATE TRIGGER update_support_feedback_updated_at
BEFORE UPDATE ON public.support_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_support_updated_at();

CREATE TRIGGER update_support_settings_updated_at
BEFORE UPDATE ON public.support_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_support_updated_at();

-- Insert default categories
INSERT INTO public.support_categories (name, description, icon_name, color, sort_order) VALUES
('General Support', 'General questions and assistance', 'HelpCircle', 'blue', 1),
('Technical Issues', 'Bug reports and technical problems', 'AlertTriangle', 'red', 2),
('Feature Requests', 'Suggestions for new features', 'Lightbulb', 'yellow', 3),
('Billing & Accounts', 'Payment and account related questions', 'CreditCard', 'green', 4),
('Project Management', 'Questions about using project features', 'FolderOpen', 'purple', 5),
('Integrations', 'Help with third-party integrations', 'ExternalLink', 'orange', 6);

-- Insert sample FAQs
INSERT INTO public.support_faqs (question, answer, category_id, sort_order, is_featured) VALUES
('How do I create a new project?', 'To create a new project, go to the Projects page and click the "New Project" button. Fill in the project details and click "Create Project".', (SELECT id FROM public.support_categories WHERE name = 'Project Management'), 1, true),
('How do I add team members to my project?', 'Navigate to your project and click on the "Team" tab. Then click "Add Member" and enter their email address.', (SELECT id FROM public.support_categories WHERE name = 'Project Management'), 2, true),
('How do I export data to QuickBooks?', 'Go to the Integrations page, connect your QuickBooks account, and then use the export options to sync your data.', (SELECT id FROM public.support_categories WHERE name = 'Integrations'), 1, true),
('What payment methods do you accept?', 'We accept all major credit cards, PayPal, and bank transfers for enterprise accounts.', (SELECT id FROM public.support_categories WHERE name = 'Billing & Accounts'), 1, false),
('How do I reset my password?', 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.', (SELECT id FROM public.support_categories WHERE name = 'General Support'), 1, true);