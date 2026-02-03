-- Create global sidebar settings table
CREATE TABLE IF NOT EXISTS public.global_sidebar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT NOT NULL,
  description TEXT,
  menu_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_sidebar_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view global sidebar settings
CREATE POLICY "Users can view global sidebar settings"
  ON public.global_sidebar_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage global sidebar settings
CREATE POLICY "Admins can manage global sidebar settings"
  ON public.global_sidebar_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_global_sidebar_settings_updated_at
  BEFORE UPDATE ON public.global_sidebar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default sidebar menu items
INSERT INTO public.global_sidebar_settings (menu_name, display_name, description, menu_order, enabled)
VALUES 
  ('dashboard', 'Dashboard', 'Main dashboard overview', 1, true),
  ('projects', 'Projects', 'Project management', 2, true),
  ('new-project', 'New Project', 'Create new project', 3, true),
  ('team', 'Team', 'Team management', 4, true),
  ('budget', 'Budget & Finance', 'Budget and financial management', 5, true),
  ('alerts', 'Risk Alerts', 'Risk alerts and notifications', 6, true),
  ('calendar', 'Calendar', 'Project calendar', 7, true),
  ('reports', 'Reports', 'Generate and view reports', 8, true),
  ('integrations', 'Integrations', 'Third-party integrations', 9, true),
  ('templates', 'Templates', 'Project templates', 10, true),
  ('chat', 'Internal Chat', 'Team communication', 11, true),
  ('compliance', 'Compliance', 'Compliance management', 12, true),
  ('admin', 'Admin', 'Admin panel', 13, true),
  ('security', 'Security', 'Security dashboard', 14, true)
ON CONFLICT (menu_name) DO NOTHING;