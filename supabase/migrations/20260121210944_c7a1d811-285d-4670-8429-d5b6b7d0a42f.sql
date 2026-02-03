-- Add Map View to global_feature_settings
INSERT INTO public.global_feature_settings (
  feature_key,
  feature_name,
  display_name,
  description,
  enabled,
  is_enabled,
  show_as_upcoming,
  category,
  parent_feature_key,
  sort_order,
  show_in_sidebar,
  sidebar_path
) VALUES (
  'map_view',
  'Map View',
  'Map View',
  'Airbnb-style map view for visualizing project locations',
  true,
  true,
  false,
  'project_management',
  NULL,
  25,
  false,
  NULL
) ON CONFLICT (feature_key) DO NOTHING;