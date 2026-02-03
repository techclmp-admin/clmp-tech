-- Move map_view to 'project' category so it shows in Admin panel
UPDATE public.global_feature_settings 
SET category = 'project'
WHERE feature_key = 'map_view';

-- Also move any other features from project_management to project for consistency
UPDATE public.global_feature_settings 
SET category = 'project'
WHERE category = 'project_management';