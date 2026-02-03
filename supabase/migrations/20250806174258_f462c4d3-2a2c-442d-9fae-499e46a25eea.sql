-- Create project templates table
CREATE TABLE public.project_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'general',
  is_system_template BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create project wizard steps table
CREATE TABLE public.project_wizard_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_data JSONB NOT NULL DEFAULT '{}',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team invitations table
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  invitation_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file uploads table for project documents
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_wizard_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_templates
CREATE POLICY "Users can view active templates" 
ON public.project_templates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can create custom templates" 
ON public.project_templates 
FOR INSERT 
WITH CHECK (auth.uid() = created_by AND is_system_template = false);

CREATE POLICY "Users can update their own templates" 
ON public.project_templates 
FOR UPDATE 
USING (auth.uid() = created_by);

-- RLS Policies for project_wizard_steps
CREATE POLICY "Project members can view wizard steps" 
ON public.project_wizard_steps 
FOR SELECT 
USING (project_id IN (
  SELECT project_id FROM public.project_members 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Project admins can manage wizard steps" 
ON public.project_wizard_steps 
FOR ALL 
USING (project_id IN (
  SELECT project_id FROM public.project_members 
  WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
));

-- RLS Policies for team_invitations
CREATE POLICY "Project admins can manage invitations" 
ON public.team_invitations 
FOR ALL 
USING (project_id IN (
  SELECT project_id FROM public.project_members 
  WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
));

CREATE POLICY "Users can view invitations sent to their email" 
ON public.team_invitations 
FOR SELECT 
USING (email = (
  SELECT email FROM auth.users WHERE id = auth.uid()
));

-- RLS Policies for project_files
CREATE POLICY "Project members can view files" 
ON public.project_files 
FOR SELECT 
USING (
  is_public = true OR 
  project_id IN (
    SELECT project_id FROM public.project_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Project members can upload files" 
ON public.project_files 
FOR INSERT 
WITH CHECK (
  auth.uid() = uploaded_by AND 
  project_id IN (
    SELECT project_id FROM public.project_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "File uploaders and project admins can update files" 
ON public.project_files 
FOR UPDATE 
USING (
  auth.uid() = uploaded_by OR 
  project_id IN (
    SELECT project_id FROM public.project_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  )
);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', false);

-- Storage policies for project files
CREATE POLICY "Project members can upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Project members can view their project files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'project-files');

-- Create updated_at trigger for tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_templates_updated_at
  BEFORE UPDATE ON public.project_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON public.project_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default project templates
INSERT INTO public.project_templates (name, description, template_data, category, is_system_template) VALUES
('Residential Construction', 'Template for residential building projects', '{"phases": ["Planning", "Foundation", "Framing", "Roofing", "Interior", "Final"], "default_tasks": [{"name": "Site Survey", "phase": "Planning"}, {"name": "Permits", "phase": "Planning"}, {"name": "Excavation", "phase": "Foundation"}]}', 'residential', true),
('Commercial Construction', 'Template for commercial building projects', '{"phases": ["Pre-Construction", "Site Preparation", "Structure", "MEP", "Interior Fit-out", "Commissioning"], "default_tasks": [{"name": "Design Review", "phase": "Pre-Construction"}, {"name": "Site Preparation", "phase": "Site Preparation"}]}', 'commercial', true),
('Renovation Project', 'Template for home renovation projects', '{"phases": ["Assessment", "Design", "Demolition", "Construction", "Finishing"], "default_tasks": [{"name": "Current State Assessment", "phase": "Assessment"}, {"name": "Design Planning", "phase": "Design"}]}', 'renovation', true);