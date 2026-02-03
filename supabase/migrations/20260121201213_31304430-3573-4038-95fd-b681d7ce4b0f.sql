-- Add missing feature keys for Budget page tabs
INSERT INTO global_feature_settings (feature_key, feature_name, display_name, description, enabled, show_as_upcoming, category, parent_feature_key, sort_order)
VALUES 
  ('budget_trends', 'Budget Trends', 'Trends Tab', 'View budget trends over time', true, false, 'budget', 'budget_tracking', 4),
  ('budget_forecasting', 'Budget Forecasting', 'Forecasting Tab', 'Project budget forecasting', true, false, 'budget', 'budget_tracking', 5),
  ('budget_tax_calculator', 'Tax Calculator', 'Tax Calculator Tab', 'Canadian tax calculation tools', true, false, 'budget', 'budget_tracking', 6)
ON CONFLICT (feature_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- Add missing feature keys for Reports page tabs
INSERT INTO global_feature_settings (feature_key, feature_name, display_name, description, enabled, show_as_upcoming, category, parent_feature_key, sort_order)
VALUES 
  ('reports_overview', 'Reports Overview', 'Overview Tab', 'Reports overview dashboard', true, false, 'reports', 'reports_analytics', 1),
  ('reports_performance', 'Reports Performance', 'Performance Tab', 'Project performance reports', true, false, 'reports', 'reports_analytics', 2),
  ('reports_financial', 'Reports Financial', 'Financial Tab', 'Financial reports and analysis', true, false, 'reports', 'reports_analytics', 3),
  ('reports_risk', 'Reports Risk Analysis', 'Risk Analysis Tab', 'Risk analysis reports', true, false, 'reports', 'reports_analytics', 4),
  ('reports_trends', 'Reports Trends', 'Trends Tab', 'Trend analysis reports', true, false, 'reports', 'reports_analytics', 5)
ON CONFLICT (feature_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- Add missing feature keys for Alerts page tabs
INSERT INTO global_feature_settings (feature_key, feature_name, display_name, description, enabled, show_as_upcoming, category, parent_feature_key, sort_order)
VALUES 
  ('alerts_overview', 'Alerts Overview', 'Overview Tab', 'AI Risk alerts overview', true, false, 'ai', 'ai_risk_management', 1),
  ('alerts_by_project', 'Alerts By Project', 'By Project Tab', 'View alerts grouped by project', true, false, 'ai', 'ai_risk_management', 2),
  ('alerts_all', 'All Alerts', 'All Alerts Tab', 'View all active alerts', true, false, 'ai', 'ai_risk_management', 3),
  ('alerts_weather', 'Weather Alerts', 'Weather Tab', 'Weather-related risk alerts', true, false, 'ai', 'ai_risk_management', 4)
ON CONFLICT (feature_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;

-- Add Reports Analytics as parent feature if missing
INSERT INTO global_feature_settings (feature_key, feature_name, display_name, description, enabled, show_as_upcoming, category, sort_order)
VALUES 
  ('reports_analytics', 'Reports & Analytics', 'Reports & Analytics', 'Project reports and analytics module', true, false, 'reports', 1)
ON CONFLICT (feature_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;