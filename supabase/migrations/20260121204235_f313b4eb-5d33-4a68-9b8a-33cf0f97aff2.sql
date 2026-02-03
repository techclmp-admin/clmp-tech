-- Add Kanban Board and Gantt Chart to global feature settings
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
  'kanban_board',
  'Kanban Board',
  true,
  'Kanban Board',
  'Visual task management with drag-and-drop columns',
  false,
  NULL,
  'project_management',
  51,
  NULL,
  false,
  NULL,
  NULL
),
(
  'gantt_chart',
  'Gantt Chart',
  true,
  'Gantt Chart',
  'Timeline view of project tasks and milestones',
  false,
  NULL,
  'project_management',
  52,
  NULL,
  false,
  NULL,
  NULL
)
ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;