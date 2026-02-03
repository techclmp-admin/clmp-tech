-- Add show_as_upcoming column to global_feature_settings
ALTER TABLE public.global_feature_settings 
ADD COLUMN show_as_upcoming BOOLEAN NOT NULL DEFAULT false;

-- Add show_as_upcoming column to global_sidebar_settings
ALTER TABLE public.global_sidebar_settings 
ADD COLUMN show_as_upcoming BOOLEAN NOT NULL DEFAULT false;

-- Add comment to explain the columns
COMMENT ON COLUMN public.global_feature_settings.show_as_upcoming IS 'When disabled, show this feature as "Coming Soon" to users';
COMMENT ON COLUMN public.global_sidebar_settings.show_as_upcoming IS 'When disabled, show this menu item as "Coming Soon" to users';