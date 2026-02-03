-- Add new CCTV sub-features for Quality Control and Risk Detection
INSERT INTO public.global_feature_settings (
  feature_key, feature_name, display_name, description, enabled, show_as_upcoming,
  parent_feature_key, category, show_in_sidebar, sidebar_order
) VALUES 
  ('cctv_quality_control', 'CCTV Quality Control', 'Quality Control', 
   'AI-assisted quality inspection and defect detection', true, false,
   'cctv_ai_system', 'AI', true, 99),
  ('cctv_risk_detection', 'CCTV Risk Detection', 'Risk Detection', 
   'Real-time danger detection with heatmap visualization', true, false,
   'cctv_ai_system', 'AI', true, 99)
ON CONFLICT (feature_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;