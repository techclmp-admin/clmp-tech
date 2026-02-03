-- Seed Global Feature Settings
INSERT INTO public.global_feature_settings (feature_key, feature_name, display_name, description, is_enabled, enabled, show_as_upcoming, requires_subscription) VALUES
('project_management', 'Project Management', 'Project Management', 'Core project creation and management features', true, true, false, ARRAY['free', 'pro', 'business', 'enterprise']),
('task_management', 'Task Management', 'Task Management', 'Create, assign, and track project tasks', true, true, false, ARRAY['free', 'pro', 'business', 'enterprise']),
('team_collaboration', 'Team Collaboration', 'Team Collaboration', 'Invite team members and collaborate on projects', true, true, false, ARRAY['free', 'pro', 'business', 'enterprise']),
('budget_tracking', 'Budget Tracking', 'Budget & Finance', 'Track project budgets and expenses', true, true, false, ARRAY['pro', 'business', 'enterprise']),
('gantt_chart', 'Gantt Chart', 'Gantt Chart', 'Visual project timeline and scheduling', true, true, false, ARRAY['pro', 'business', 'enterprise']),
('kanban_board', 'Kanban Board', 'Kanban Board', 'Drag-and-drop task management board', true, true, false, ARRAY['free', 'pro', 'business', 'enterprise']),
('file_management', 'File Management', 'Document Manager', 'Upload and manage project documents', true, true, false, ARRAY['free', 'pro', 'business', 'enterprise']),
('chat_rooms', 'Chat Rooms', 'Team Chat', 'Real-time team communication', true, true, false, ARRAY['pro', 'business', 'enterprise']),
('compliance_tracking', 'Compliance Tracking', 'OBC Compliance', 'Ontario Building Code compliance tracking', true, true, false, ARRAY['pro', 'business', 'enterprise']),
('permit_tracking', 'Permit Tracking', 'Permit Tracker', 'Track building permits and applications', true, true, false, ARRAY['pro', 'business', 'enterprise']),
('inspection_tracking', 'Inspection Tracking', 'Inspection Tracker', 'Schedule and track building inspections', true, true, false, ARRAY['pro', 'business', 'enterprise']),
('weather_widget', 'Weather Widget', 'Weather Widget', 'Real-time weather data for project locations', true, true, false, ARRAY['free', 'pro', 'business', 'enterprise']),
('ai_risk_management', 'AI Risk Management', 'AI Risk Alerts', 'AI-powered project risk analysis and alerts', false, false, true, ARRAY['business', 'enterprise']),
('quickbooks_integration', 'QuickBooks Integration', 'QuickBooks', 'Sync expenses with QuickBooks', false, false, true, ARRAY['business', 'enterprise']),
('sage50_integration', 'Sage 50 Integration', 'Sage 50', 'Sync with Sage 50 accounting', false, false, true, ARRAY['enterprise']),
('project_templates', 'Project Templates', 'Templates', 'Pre-built project templates', true, true, false, ARRAY['pro', 'business', 'enterprise']),
('reports_analytics', 'Reports & Analytics', 'Reports', 'Generate project reports and analytics', true, true, false, ARRAY['pro', 'business', 'enterprise']),
('calendar_view', 'Calendar View', 'Calendar', 'Project calendar and scheduling', true, true, false, ARRAY['free', 'pro', 'business', 'enterprise']);

-- Seed Global Sidebar Settings
INSERT INTO public.global_sidebar_settings (menu_name, display_name, description, path, icon, menu_order, enabled, show_as_upcoming, required_subscription, required_roles) VALUES
('Dashboard', 'Dashboard', 'Main dashboard overview', '/dashboard', 'LayoutDashboard', 1, true, false, ARRAY['free', 'pro', 'business', 'enterprise'], NULL),
('Projects', 'Projects', 'View and manage projects', '/projects', 'FolderOpen', 2, true, false, ARRAY['free', 'pro', 'business', 'enterprise'], NULL),
('New Project', 'New Project', 'Create a new project', '/projects/new', 'PlusCircle', 3, true, false, ARRAY['free', 'pro', 'business', 'enterprise'], NULL),
('Team', 'Team', 'Manage team members', '/team', 'Users', 4, true, false, ARRAY['free', 'pro', 'business', 'enterprise'], NULL),
('Budget & Finance', 'Budget & Finance', 'Budget tracking and expenses', '/budget', 'DollarSign', 5, true, false, ARRAY['pro', 'business', 'enterprise'], NULL),
('Calendar', 'Calendar', 'Project calendar and scheduling', '/calendar', 'Calendar', 6, true, false, ARRAY['free', 'pro', 'business', 'enterprise'], NULL),
('Reports', 'Reports', 'Project reports and analytics', '/reports', 'BarChart3', 7, true, false, ARRAY['pro', 'business', 'enterprise'], NULL),
('Templates', 'Templates', 'Project templates library', '/templates', 'FileText', 8, true, false, ARRAY['pro', 'business', 'enterprise'], NULL),
('Compliance', 'Compliance', 'OBC compliance and permits', '/compliance', 'Shield', 9, true, false, ARRAY['pro', 'business', 'enterprise'], NULL),
('AI Risk Alerts', 'AI Risk Alerts', 'AI-powered risk analysis', '/alerts', 'AlertTriangle', 10, false, true, ARRAY['business', 'enterprise'], NULL),
('Chat Room', 'Chat Room', 'Team communication', '/chat', 'MessageCircle', 11, true, false, ARRAY['pro', 'business', 'enterprise'], NULL),
('Admin', 'Admin', 'System administration', '/admin', 'Settings', 12, true, false, ARRAY['pro', 'business', 'enterprise'], ARRAY['admin']),
('Security', 'Security', 'Security dashboard', '/security', 'ShieldCheck', 13, true, false, ARRAY['pro', 'business', 'enterprise'], ARRAY['admin']),
('Integrations', 'Integrations', 'Third-party integrations', '/integrations', 'Plug', 14, false, true, ARRAY['business', 'enterprise'], NULL),
('Settings', 'Settings', 'User settings', '/settings', 'Cog', 15, true, false, ARRAY['free', 'pro', 'business', 'enterprise'], NULL);