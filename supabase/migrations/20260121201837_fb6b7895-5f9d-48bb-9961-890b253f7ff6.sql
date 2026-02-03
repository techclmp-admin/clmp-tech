-- Add show_in_sidebar column to global_feature_settings table
ALTER TABLE global_feature_settings 
ADD COLUMN IF NOT EXISTS show_in_sidebar BOOLEAN DEFAULT true;

-- Add sidebar_order column for menu ordering
ALTER TABLE global_feature_settings 
ADD COLUMN IF NOT EXISTS sidebar_order INTEGER DEFAULT 99;

-- Add sidebar_icon column for menu icon name
ALTER TABLE global_feature_settings 
ADD COLUMN IF NOT EXISTS sidebar_icon TEXT;

-- Add sidebar_path column for menu path
ALTER TABLE global_feature_settings 
ADD COLUMN IF NOT EXISTS sidebar_path TEXT;

-- Update existing features with sidebar configuration based on current global_sidebar_settings
-- Dashboard
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 1, sidebar_icon = 'LayoutDashboard', sidebar_path = '/dashboard'
WHERE feature_key = 'dashboard';

-- Projects
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 2, sidebar_icon = 'FolderOpen', sidebar_path = '/projects'
WHERE feature_key = 'projects' OR feature_key = 'project_management';

-- Team
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 4, sidebar_icon = 'Users', sidebar_path = '/team'
WHERE feature_key = 'team_management' OR feature_key = 'team';

-- Budget & Finance
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 5, sidebar_icon = 'DollarSign', sidebar_path = '/budget'
WHERE feature_key = 'budget_tracking';

-- Calendar  
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 6, sidebar_icon = 'Calendar', sidebar_path = '/calendar'
WHERE feature_key = 'calendar' OR feature_key = 'project_calendar';

-- Reports
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 7, sidebar_icon = 'BarChart3', sidebar_path = '/reports'
WHERE feature_key = 'reports_analytics';

-- Templates
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 8, sidebar_icon = 'FileText', sidebar_path = '/templates'
WHERE feature_key = 'templates';

-- Compliance
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 9, sidebar_icon = 'Shield', sidebar_path = '/compliance'
WHERE feature_key = 'compliance';

-- AI Risk Alerts
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 10, sidebar_icon = 'AlertTriangle', sidebar_path = '/alerts'
WHERE feature_key = 'ai_risk_management';

-- Chat Room
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 11, sidebar_icon = 'MessageCircle', sidebar_path = '/chat'
WHERE feature_key = 'chat';

-- Admin
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 12, sidebar_icon = 'ShieldCheck', sidebar_path = '/admin'
WHERE feature_key = 'admin';

-- Integrations
UPDATE global_feature_settings 
SET show_in_sidebar = true, sidebar_order = 14, sidebar_icon = 'Plug', sidebar_path = '/integrations'
WHERE feature_key = 'integrations';

-- Insert missing parent features that exist in sidebar but not in features
INSERT INTO global_feature_settings (feature_key, feature_name, display_name, description, enabled, show_as_upcoming, category, sort_order, show_in_sidebar, sidebar_order, sidebar_icon, sidebar_path)
VALUES 
  ('dashboard', 'Dashboard', 'Dashboard', 'Main dashboard overview', true, false, 'project', 1, true, 1, 'LayoutDashboard', '/dashboard'),
  ('new_project', 'New Project', 'New Project', 'Create a new project', true, false, 'project', 2, true, 3, 'PlusCircle', '/projects/new'),
  ('templates', 'Templates', 'Templates', 'Project templates library', true, false, 'project', 8, true, 8, 'FileText', '/templates'),
  ('admin', 'Admin', 'Admin Panel', 'System administration', true, false, 'tools', 12, true, 12, 'ShieldCheck', '/admin'),
  ('security_dashboard', 'Security Dashboard', 'Security', 'Security monitoring dashboard', true, false, 'tools', 13, true, 13, 'ShieldAlert', '/security')
ON CONFLICT (feature_key) DO UPDATE SET
  show_in_sidebar = EXCLUDED.show_in_sidebar,
  sidebar_order = EXCLUDED.sidebar_order,
  sidebar_icon = EXCLUDED.sidebar_icon,
  sidebar_path = EXCLUDED.sidebar_path;