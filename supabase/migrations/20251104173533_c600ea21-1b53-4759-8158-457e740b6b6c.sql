-- Drop the per-project feature table and related objects
DROP TRIGGER IF EXISTS initialize_project_features_trigger ON public.projects;
DROP FUNCTION IF EXISTS public.initialize_project_features();
DROP TRIGGER IF EXISTS update_project_features_updated_at ON public.project_features;
DROP FUNCTION IF EXISTS public.update_project_features_updated_at();
DROP TABLE IF EXISTS public.project_features;

-- Create global feature settings table
CREATE TABLE IF NOT EXISTS public.global_feature_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_feature_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view global feature settings
CREATE POLICY "Users can view global feature settings"
  ON public.global_feature_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage global feature settings
CREATE POLICY "Admins can manage global feature settings"
  ON public.global_feature_settings
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
CREATE TRIGGER update_global_feature_settings_updated_at
  BEFORE UPDATE ON public.global_feature_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default feature settings
INSERT INTO public.global_feature_settings (feature_name, display_name, description, enabled)
VALUES 
  ('overview', 'Overview', 'Project overview and basic information', true),
  ('kanban', 'Kanban Board', 'Kanban board for task management', true),
  ('timeline', 'Timeline', 'Gantt chart timeline view', true),
  ('tasks', 'Tasks', 'Task list and management', true),
  ('team', 'Team', 'Team member management and invitations', true),
  ('chat', 'Chat', 'Project chat and communication', true),
  ('files', 'Files', 'File storage and management', true),
  ('weather', 'Weather', 'Weather widget and risk analysis', true)
ON CONFLICT (feature_name) DO NOTHING;