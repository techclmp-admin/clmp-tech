-- Create admin features table for controlling Operation Admin access
CREATE TABLE IF NOT EXISTS public.admin_feature_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_enabled BOOLEAN DEFAULT true,
  show_as_upcoming BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_feature_settings ENABLE ROW LEVEL SECURITY;

-- Only system admins can manage admin features
CREATE POLICY "System admins can view admin features"
ON public.admin_feature_settings
FOR SELECT
USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can update admin features"
ON public.admin_feature_settings
FOR UPDATE
USING (public.is_system_admin(auth.uid()));

CREATE POLICY "System admins can insert admin features"
ON public.admin_feature_settings
FOR INSERT
WITH CHECK (public.is_system_admin(auth.uid()));

-- Operation admins can view (to check their permissions)
CREATE POLICY "Any admin can read admin features"
ON public.admin_feature_settings
FOR SELECT
USING (public.is_any_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_admin_feature_settings_updated_at
BEFORE UPDATE ON public.admin_feature_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin features
INSERT INTO public.admin_feature_settings (feature_key, feature_name, description, category, is_enabled, show_as_upcoming, sort_order) VALUES
('admin_dashboard', 'Dashboard', 'Admin dashboard overview with statistics', 'overview', true, false, 1),
('admin_users', 'User Management', 'View and manage user accounts', 'users', true, false, 2),
('admin_roles', 'Role Management', 'Manage user roles and permissions', 'users', true, false, 3),
('admin_projects', 'Project Management', 'View and manage all projects', 'content', true, false, 4),
('admin_emails', 'Email Management', 'Manage email templates and campaigns', 'communication', true, false, 5),
('admin_contacts', 'Contact Requests', 'View and respond to contact requests', 'communication', true, false, 6),
('admin_support', 'Support Tickets', 'Manage support requests', 'communication', true, false, 7),
('admin_promo_codes', 'Promo Codes', 'Create and manage promotional codes', 'finance', true, false, 8),
('admin_subscriptions', 'Subscription Management', 'View and manage user subscriptions', 'finance', true, false, 9),
('admin_system', 'System Health', 'Monitor system health and performance', 'system', true, false, 10),
('admin_analytics', 'Analytics', 'View detailed analytics and reports', 'reports', true, false, 11),
('admin_audit_logs', 'Audit Logs', 'View system audit logs', 'system', true, false, 12),
('admin_security', 'Security Dashboard', 'Monitor security events and threats', 'system', true, false, 13),
('admin_settings', 'Admin Settings', 'Configure admin panel settings', 'system', true, false, 14)
ON CONFLICT (feature_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_feature_settings_key ON public.admin_feature_settings(feature_key);
CREATE INDEX IF NOT EXISTS idx_admin_feature_settings_category ON public.admin_feature_settings(category);