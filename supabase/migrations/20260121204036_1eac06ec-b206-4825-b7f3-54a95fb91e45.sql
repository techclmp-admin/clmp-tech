-- Add Chat and File Manager to global feature settings
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
  'project_chat',
  'Project Chat',
  true,
  'Project Chat',
  'Real-time chat rooms for project team collaboration',
  false,
  NULL,
  'collaboration',
  49,
  NULL,
  false,
  NULL,
  NULL
),
(
  'file_manager',
  'File Manager',
  true,
  'File Manager',
  'Upload, organize and share project files and documents',
  false,
  NULL,
  'project_management',
  50,
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