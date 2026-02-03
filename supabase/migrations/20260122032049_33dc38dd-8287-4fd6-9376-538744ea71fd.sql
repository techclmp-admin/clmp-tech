-- Add CCTV AI System feature to global_feature_settings
INSERT INTO global_feature_settings (
  feature_key,
  feature_name,
  display_name,
  description,
  enabled,
  show_as_upcoming,
  show_in_sidebar,
  sidebar_order,
  sidebar_icon,
  sidebar_path,
  category
) VALUES (
  'cctv_ai_system',
  'CCTV AI System',
  'CCTV AI Operation System',
  'AI-powered CCTV monitoring for construction sites with PPE detection, intrusion alerts, and progress tracking',
  true,
  false,
  true,
  11,
  'Video',
  '/cctv',
  'AI'
) ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  show_in_sidebar = EXCLUDED.show_in_sidebar,
  sidebar_order = EXCLUDED.sidebar_order,
  sidebar_icon = EXCLUDED.sidebar_icon,
  sidebar_path = EXCLUDED.sidebar_path,
  category = EXCLUDED.category;

-- Add sub-features for CCTV AI System
INSERT INTO global_feature_settings (
  feature_key,
  feature_name,
  display_name,
  description,
  enabled,
  show_as_upcoming,
  parent_feature_key,
  category
) VALUES 
(
  'cctv_live_view',
  'CCTV Live View',
  'Live Camera View',
  'Real-time camera streaming and monitoring',
  true,
  false,
  'cctv_ai_system',
  'AI'
),
(
  'cctv_ai_detection',
  'CCTV AI Detection',
  'AI Detection & Alerts',
  'AI-powered detection for PPE violations, intrusions, and safety hazards',
  true,
  false,
  'cctv_ai_system',
  'AI'
),
(
  'cctv_analytics',
  'CCTV Analytics',
  'CCTV Analytics',
  'AI performance metrics and detection statistics',
  true,
  false,
  'cctv_ai_system',
  'AI'
),
(
  'cctv_progress_tracking',
  'CCTV Progress Tracking',
  'Progress Tracking',
  'AI-powered visual construction progress analysis',
  false,
  true,
  'cctv_ai_system',
  'AI'
)
ON CONFLICT (feature_key) DO NOTHING;