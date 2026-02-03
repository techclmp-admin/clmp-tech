-- Add Weather Widget to global feature settings
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
) VALUES (
  'weather_widget',
  'Weather Widget',
  true,
  'Weather Widget',
  'Real-time weather data and forecasts for project locations',
  false,
  NULL,
  'project_management',
  48,
  NULL,
  false,
  NULL,
  NULL
) ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;