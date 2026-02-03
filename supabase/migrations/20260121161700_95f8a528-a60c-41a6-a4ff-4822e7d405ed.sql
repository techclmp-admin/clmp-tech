-- Add parent_feature_key and category columns for hierarchical feature management
ALTER TABLE public.global_feature_settings
ADD COLUMN IF NOT EXISTS parent_feature_key TEXT REFERENCES public.global_feature_settings(feature_key),
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update display_name to be more consistent
UPDATE public.global_feature_settings SET display_name = feature_name WHERE display_name IS NULL;

-- Add AI Chatbot feature
INSERT INTO public.global_feature_settings (feature_key, feature_name, display_name, description, enabled, show_as_upcoming, requires_subscription, category, sort_order)
VALUES ('ai_chatbot', 'AI Chatbot', 'AI Chatbot', 'AI-powered chat assistant for project guidance', true, false, ARRAY['free', 'pro', 'business', 'enterprise'], 'ai', 10)
ON CONFLICT (feature_key) DO NOTHING;

-- Add sub-features for Budget module
INSERT INTO public.global_feature_settings (feature_key, feature_name, display_name, description, enabled, show_as_upcoming, requires_subscription, parent_feature_key, category, sort_order)
VALUES 
  ('budget_categories', 'Budget Categories', 'Categories Tab', 'Manage expense categories', true, false, ARRAY['pro', 'business', 'enterprise'], 'budget_tracking', 'budget', 1),
  ('budget_invoices', 'Budget Invoices', 'Invoices Tab', 'Manage project invoices', true, false, ARRAY['pro', 'business', 'enterprise'], 'budget_tracking', 'budget', 2),
  ('budget_analytics', 'Budget Analytics', 'Analytics Tab', 'Budget analytics and reporting', true, false, ARRAY['business', 'enterprise'], 'budget_tracking', 'budget', 3)
ON CONFLICT (feature_key) DO NOTHING;

-- Add sub-features for Compliance module
INSERT INTO public.global_feature_settings (feature_key, feature_name, display_name, description, enabled, show_as_upcoming, requires_subscription, parent_feature_key, category, sort_order)
VALUES 
  ('compliance_permits', 'Compliance Permits', 'Permits Tab', 'Track building permits', true, false, ARRAY['pro', 'business', 'enterprise'], 'compliance_tracking', 'compliance', 1),
  ('compliance_inspections', 'Compliance Inspections', 'Inspections Tab', 'Schedule and track inspections', true, false, ARRAY['pro', 'business', 'enterprise'], 'compliance_tracking', 'compliance', 2),
  ('compliance_obc', 'OBC Compliance', 'OBC Tab', 'Ontario Building Code compliance', true, false, ARRAY['pro', 'business', 'enterprise'], 'compliance_tracking', 'compliance', 3),
  ('compliance_safety', 'Safety Compliance', 'Safety Tab', 'Safety compliance tracking', true, false, ARRAY['pro', 'business', 'enterprise'], 'compliance_tracking', 'compliance', 4)
ON CONFLICT (feature_key) DO NOTHING;

-- Add sub-features for Project Details tabs
INSERT INTO public.global_feature_settings (feature_key, feature_name, display_name, description, enabled, show_as_upcoming, requires_subscription, parent_feature_key, category, sort_order)
VALUES 
  ('project_overview_tab', 'Project Overview', 'Overview Tab', 'Project overview information', true, false, ARRAY['free', 'pro', 'business', 'enterprise'], 'project_management', 'project', 1),
  ('project_tasks_tab', 'Project Tasks Tab', 'Tasks Tab', 'Task list within project', true, false, ARRAY['free', 'pro', 'business', 'enterprise'], 'project_management', 'project', 2),
  ('project_finance_tab', 'Project Finance Tab', 'Finance Tab', 'Project finance overview', true, false, ARRAY['pro', 'business', 'enterprise'], 'project_management', 'project', 3),
  ('project_calendar_tab', 'Project Calendar Tab', 'Calendar Tab', 'Project calendar events', true, false, ARRAY['free', 'pro', 'business', 'enterprise'], 'project_management', 'project', 4),
  ('project_risk_tab', 'Project Risk Tab', 'Risk Tab', 'Project risk analysis', true, false, ARRAY['business', 'enterprise'], 'project_management', 'project', 5),
  ('project_compliance_tab', 'Project Compliance Tab', 'Compliance Tab', 'Project compliance tracking', true, false, ARRAY['pro', 'business', 'enterprise'], 'project_management', 'project', 6),
  ('project_documents_tab', 'Project Documents Tab', 'Documents Tab', 'Project file management', true, false, ARRAY['free', 'pro', 'business', 'enterprise'], 'project_management', 'project', 7),
  ('project_activity_tab', 'Project Activity Tab', 'Activity Tab', 'Project activity log', true, false, ARRAY['free', 'pro', 'business', 'enterprise'], 'project_management', 'project', 8),
  ('project_team_tab', 'Project Team Tab', 'Team Tab', 'Project team management', true, false, ARRAY['free', 'pro', 'business', 'enterprise'], 'project_management', 'project', 9)
ON CONFLICT (feature_key) DO NOTHING;

-- Add sub-features for Reports module
INSERT INTO public.global_feature_settings (feature_key, feature_name, display_name, description, enabled, show_as_upcoming, requires_subscription, parent_feature_key, category, sort_order)
VALUES 
  ('reports_export', 'Reports Export', 'Export Reports', 'Export reports to CSV/PDF', true, false, ARRAY['pro', 'business', 'enterprise'], 'reports_analytics', 'reports', 1),
  ('reports_dashboard', 'Reports Dashboard', 'Dashboard View', 'Analytics dashboard view', true, false, ARRAY['pro', 'business', 'enterprise'], 'reports_analytics', 'reports', 2)
ON CONFLICT (feature_key) DO NOTHING;

-- Add sub-features for Chat module  
INSERT INTO public.global_feature_settings (feature_key, feature_name, display_name, description, enabled, show_as_upcoming, requires_subscription, parent_feature_key, category, sort_order)
VALUES 
  ('chat_direct_messages', 'Direct Messages', 'Direct Messages', 'Private one-on-one messaging', true, false, ARRAY['pro', 'business', 'enterprise'], 'chat_rooms', 'chat', 1),
  ('chat_group_rooms', 'Group Chat Rooms', 'Group Rooms', 'Create and manage group chat rooms', true, false, ARRAY['pro', 'business', 'enterprise'], 'chat_rooms', 'chat', 2),
  ('chat_file_sharing', 'Chat File Sharing', 'File Sharing', 'Share files in chat', true, false, ARRAY['business', 'enterprise'], 'chat_rooms', 'chat', 3)
ON CONFLICT (feature_key) DO NOTHING;

-- Update categories for existing root features
UPDATE public.global_feature_settings SET category = 'project', sort_order = 1 WHERE feature_key = 'project_management' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'project', sort_order = 2 WHERE feature_key = 'task_management' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'project', sort_order = 3 WHERE feature_key = 'team_collaboration' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'finance', sort_order = 4 WHERE feature_key = 'budget_tracking' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'project', sort_order = 5 WHERE feature_key = 'gantt_chart' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'project', sort_order = 6 WHERE feature_key = 'kanban_board' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'project', sort_order = 7 WHERE feature_key = 'file_management' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'communication', sort_order = 8 WHERE feature_key = 'chat_rooms' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'compliance', sort_order = 9 WHERE feature_key = 'compliance_tracking' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'compliance', sort_order = 10 WHERE feature_key = 'permit_tracking' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'compliance', sort_order = 11 WHERE feature_key = 'inspection_tracking' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'tools', sort_order = 12 WHERE feature_key = 'weather_widget' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'integrations', sort_order = 13 WHERE feature_key = 'quickbooks_integration' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'integrations', sort_order = 14 WHERE feature_key = 'sage50_integration' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'project', sort_order = 15 WHERE feature_key = 'project_templates' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'reports', sort_order = 16 WHERE feature_key = 'reports_analytics' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'project', sort_order = 17 WHERE feature_key = 'calendar_view' AND parent_feature_key IS NULL;
UPDATE public.global_feature_settings SET category = 'ai', sort_order = 18 WHERE feature_key = 'ai_risk_management' AND parent_feature_key IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_global_feature_settings_parent ON public.global_feature_settings(parent_feature_key);
CREATE INDEX IF NOT EXISTS idx_global_feature_settings_category ON public.global_feature_settings(category);