-- Add parent_feature_key column for sub-tab relationships
ALTER TABLE public.admin_feature_settings 
ADD COLUMN IF NOT EXISTS parent_feature_key TEXT REFERENCES public.admin_feature_settings(feature_key);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_feature_settings_parent 
ON public.admin_feature_settings(parent_feature_key);

-- Insert sub-tabs for existing main tabs
-- Users tab sub-tabs
INSERT INTO public.admin_feature_settings (feature_key, feature_name, description, category, is_enabled, show_as_upcoming, sort_order, parent_feature_key)
VALUES 
  ('admin_users_list', 'User List', 'View all registered users', 'users', true, false, 1, 'admin_users'),
  ('admin_users_create', 'Create User', 'Create new user accounts', 'users', true, false, 2, 'admin_users'),
  ('admin_users_ban', 'Ban/Unban Users', 'Manage user access restrictions', 'users', true, false, 3, 'admin_users')
ON CONFLICT (feature_key) DO NOTHING;

-- Projects tab sub-tabs
INSERT INTO public.admin_feature_settings (feature_key, feature_name, description, category, is_enabled, show_as_upcoming, sort_order, parent_feature_key)
VALUES 
  ('admin_projects_list', 'Project List', 'View all projects', 'content', true, false, 1, 'admin_projects'),
  ('admin_projects_delete', 'Delete Projects', 'Remove projects from system', 'content', true, false, 2, 'admin_projects'),
  ('admin_projects_transfer', 'Transfer Ownership', 'Transfer project ownership', 'content', false, true, 3, 'admin_projects')
ON CONFLICT (feature_key) DO NOTHING;

-- Emails tab sub-tabs
INSERT INTO public.admin_feature_settings (feature_key, feature_name, description, category, is_enabled, show_as_upcoming, sort_order, parent_feature_key)
VALUES 
  ('admin_emails_templates', 'Email Templates', 'Manage email templates', 'communication', true, false, 1, 'admin_emails'),
  ('admin_emails_campaigns', 'Bulk Campaigns', 'Send bulk email campaigns', 'communication', true, false, 2, 'admin_emails'),
  ('admin_emails_analytics', 'Email Analytics', 'View email open/click rates', 'communication', true, false, 3, 'admin_emails')
ON CONFLICT (feature_key) DO NOTHING;

-- Subscriptions tab sub-tabs
INSERT INTO public.admin_feature_settings (feature_key, feature_name, description, category, is_enabled, show_as_upcoming, sort_order, parent_feature_key)
VALUES 
  ('admin_subs_list', 'Subscription List', 'View all subscriptions', 'finance', true, false, 1, 'admin_subscriptions'),
  ('admin_subs_analytics', 'Subscription Analytics', 'Revenue and churn analytics', 'finance', true, false, 2, 'admin_subscriptions'),
  ('admin_subs_manage', 'Manage Plans', 'Edit subscription plans', 'finance', false, true, 3, 'admin_subscriptions')
ON CONFLICT (feature_key) DO NOTHING;

-- Analytics tab sub-tabs  
INSERT INTO public.admin_feature_settings (feature_key, feature_name, description, category, is_enabled, show_as_upcoming, sort_order, parent_feature_key)
VALUES 
  ('admin_analytics_overview', 'Overview Stats', 'General analytics overview', 'reports', true, false, 1, 'admin_analytics'),
  ('admin_analytics_users', 'User Analytics', 'User behavior analytics', 'reports', true, false, 2, 'admin_analytics'),
  ('admin_analytics_export', 'Export Reports', 'Export analytics data', 'reports', false, true, 3, 'admin_analytics')
ON CONFLICT (feature_key) DO NOTHING;

-- System tab sub-tabs
INSERT INTO public.admin_feature_settings (feature_key, feature_name, description, category, is_enabled, show_as_upcoming, sort_order, parent_feature_key)
VALUES 
  ('admin_system_health', 'Health Check', 'System health monitoring', 'system', true, false, 1, 'admin_system'),
  ('admin_system_cache', 'Cache Management', 'Clear and manage cache', 'system', false, true, 2, 'admin_system'),
  ('admin_system_jobs', 'Background Jobs', 'View scheduled jobs', 'system', false, true, 3, 'admin_system')
ON CONFLICT (feature_key) DO NOTHING;