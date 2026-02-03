-- Fix Vietnamese descriptions to English
UPDATE public.global_feature_settings 
SET feature_name = 'PWA Installation', description = 'Show app install prompts and Install page'
WHERE feature_key = 'pwa';

UPDATE public.global_feature_settings 
SET description = 'Enable light/dark theme switching'
WHERE feature_key = 'dark_mode';

UPDATE public.global_feature_settings 
SET feature_name = 'Notifications', description = 'In-app notification system'
WHERE feature_key = 'notifications';

UPDATE public.global_feature_settings 
SET description = 'Allow login with Google OAuth'
WHERE feature_key = 'google_signin';

UPDATE public.global_feature_settings 
SET description = 'Allow login via Magic Link email'
WHERE feature_key = 'magic_link';

UPDATE public.global_feature_settings 
SET description = 'Allow login with email and password'
WHERE feature_key = 'email_password';