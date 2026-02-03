-- Fix AI Risk Alerts - it's enabled so should not show as upcoming
UPDATE global_sidebar_settings 
SET show_as_upcoming = false
WHERE menu_name = 'alerts';