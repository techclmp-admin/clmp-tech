-- Enable AI Risk Management feature
UPDATE global_feature_settings 
SET enabled = true, show_as_upcoming = false
WHERE feature_key = 'ai_risk_management';