-- Update menu_name to match code's menuKey (lowercase/kebab-case)
UPDATE public.global_sidebar_settings SET menu_name = 'dashboard' WHERE menu_name = 'Dashboard';
UPDATE public.global_sidebar_settings SET menu_name = 'projects' WHERE menu_name = 'Projects';
UPDATE public.global_sidebar_settings SET menu_name = 'new-project' WHERE menu_name = 'New Project';
UPDATE public.global_sidebar_settings SET menu_name = 'team' WHERE menu_name = 'Team';
UPDATE public.global_sidebar_settings SET menu_name = 'budget' WHERE menu_name = 'Budget & Finance';
UPDATE public.global_sidebar_settings SET menu_name = 'calendar' WHERE menu_name = 'Calendar';
UPDATE public.global_sidebar_settings SET menu_name = 'reports' WHERE menu_name = 'Reports';
UPDATE public.global_sidebar_settings SET menu_name = 'templates' WHERE menu_name = 'Templates';
UPDATE public.global_sidebar_settings SET menu_name = 'compliance' WHERE menu_name = 'Compliance';
UPDATE public.global_sidebar_settings SET menu_name = 'alerts' WHERE menu_name = 'AI Risk Alerts';
UPDATE public.global_sidebar_settings SET menu_name = 'chat' WHERE menu_name = 'Chat Room';
UPDATE public.global_sidebar_settings SET menu_name = 'admin' WHERE menu_name = 'Admin';
UPDATE public.global_sidebar_settings SET menu_name = 'security' WHERE menu_name = 'Security';
UPDATE public.global_sidebar_settings SET menu_name = 'integrations' WHERE menu_name = 'Integrations';
UPDATE public.global_sidebar_settings SET menu_name = 'settings' WHERE menu_name = 'Settings';