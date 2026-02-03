-- Add Task Management and Team Collaboration to global feature settings
INSERT INTO public.global_feature_settings (
  feature_key,
  feature_name,
  enabled,
  display_name,
  description,
  show_as_upcoming,
  parent_feature_key,
  category,
  sort_order,
  requires_subscription,
  show_in_sidebar,
  sidebar_order,
  sidebar_path
) VALUES 
(
  'task_management',
  'Task Management',
  true,
  'Task Management',
  'Create, assign, and track project tasks with priorities and deadlines',
  false,
  NULL,
  'project_management',
  53,
  NULL,
  false,
  NULL,
  NULL
),
(
  'team_collaboration',
  'Team Collaboration',
  true,
  'Team Collaboration',
  'Invite team members, manage roles, and collaborate on projects',
  false,
  NULL,
  'collaboration',
  54,
  NULL,
  true,
  6,
  '/team'
)
ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;