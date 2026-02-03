-- Create role system for CLMP (skip enum creation as it exists)

-- Create user_roles table  
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id, project_id)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  has_role_tag(auth.uid(), 'admin_sysops'::role_tag) OR
  (project_id IN (
    SELECT project_id FROM project_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ))
);

CREATE POLICY "Admins and project managers can assign roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  has_role_tag(auth.uid(), 'admin_sysops'::role_tag) OR
  (project_id IN (
    SELECT project_id FROM project_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ))
);

CREATE POLICY "Admins and project managers can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  has_role_tag(auth.uid(), 'admin_sysops'::role_tag) OR
  (project_id IN (
    SELECT project_id FROM project_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ))
);

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (has_role_tag(auth.uid(), 'admin_sysops'::role_tag));

-- Create trigger to update timestamps  
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();