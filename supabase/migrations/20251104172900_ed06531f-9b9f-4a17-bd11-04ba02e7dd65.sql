-- Create table for project feature toggles
CREATE TABLE IF NOT EXISTS public.project_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, feature_name)
);

-- Enable RLS
ALTER TABLE public.project_features ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view project features
CREATE POLICY "Users can view project features"
  ON public.project_features
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage project features
CREATE POLICY "Admins can manage project features"
  ON public.project_features
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

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_project_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_features_updated_at
  BEFORE UPDATE ON public.project_features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_features_updated_at();

-- Create function to initialize default features for new projects
CREATE OR REPLACE FUNCTION public.initialize_project_features()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default features for new project
  INSERT INTO public.project_features (project_id, feature_name, enabled)
  VALUES 
    (NEW.id, 'overview', true),
    (NEW.id, 'kanban', true),
    (NEW.id, 'timeline', true),
    (NEW.id, 'tasks', true),
    (NEW.id, 'team', true),
    (NEW.id, 'chat', true),
    (NEW.id, 'files', true),
    (NEW.id, 'weather', true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-initialize features for new projects
CREATE TRIGGER initialize_project_features_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_project_features();