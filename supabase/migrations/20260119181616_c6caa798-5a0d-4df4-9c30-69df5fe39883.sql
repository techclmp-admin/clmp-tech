-- Fix sidebar settings: set show_as_upcoming=false when enabled=true
UPDATE public.global_sidebar_settings 
SET show_as_upcoming = false, updated_at = now()
WHERE enabled = true AND show_as_upcoming = true;

-- Add missing feature settings for modules that don't have them
INSERT INTO public.global_feature_settings (feature_name, enabled, display_name, description, show_as_upcoming)
VALUES 
  ('budget', true, 'Budget & Finance', 'Budget tracking and financial management features', false),
  ('reports', true, 'Reports & Analytics', 'Project reports and analytics dashboard', false),
  ('compliance', true, 'Compliance Management', 'OBC, OHSA, and regulatory compliance tracking', false),
  ('templates', true, 'Project Templates', 'Pre-built project templates for quick setup', false),
  ('calendar', true, 'Calendar', 'Project calendar and scheduling features', false),
  ('integrations', false, 'Integrations', 'Third-party integrations (QuickBooks, Slack, etc.)', true)
ON CONFLICT (feature_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  updated_at = now();