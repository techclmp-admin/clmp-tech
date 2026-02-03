-- Add Calendar View and Project Templates to global feature settings
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
  'calendar_view',
  'Calendar View',
  true,
  'Calendar View',
  'Project calendar with scheduling, events, and deadline tracking',
  false,
  NULL,
  'project_management',
  55,
  NULL,
  true,
  5,
  '/calendar'
),
(
  'project_templates',
  'Project Templates',
  true,
  'Project Templates',
  'Pre-built project templates for Ontario building code categories',
  false,
  NULL,
  'project_management',
  56,
  NULL,
  true,
  7,
  '/templates'
)
ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;