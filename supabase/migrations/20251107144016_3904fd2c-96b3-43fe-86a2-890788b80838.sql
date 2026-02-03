-- Add AI Risk Management feature to global_feature_settings
INSERT INTO global_feature_settings (feature_name, enabled, display_name, description, show_as_upcoming)
VALUES 
  ('ai_risk_management', true, 'AI Risk Management', 'AI-powered weather risk analysis and safety recommendations for construction projects', false)
ON CONFLICT (feature_name) DO NOTHING;