-- Fix Email Management to be enabled
UPDATE admin_feature_settings 
SET is_enabled = true, show_as_upcoming = false 
WHERE feature_key = 'admin_emails';