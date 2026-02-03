-- Create role system for CLMP

-- Create enum for role tags
CREATE TYPE public.role_tag AS ENUM (
  'admin_sysops',
  'project_manager', 
  'site_supervisor',
  'team_member',
  'client_viewer'
);

-- Create roles table
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tag role_tag NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system_role BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
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
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role_tag(_user_id UUID, _role_tag role_tag)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND r.tag = _role_tag
      AND ur.status = 'active'
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role_tag(_user_id, 'admin_sysops'::role_tag);
$$;

-- Create function to get user roles for a project
CREATE OR REPLACE FUNCTION public.get_user_project_roles(_user_id UUID, _project_id UUID)
RETURNS TABLE (
  role_tag role_tag,
  role_name TEXT,
  permissions JSONB
)
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT r.tag, r.name, r.permissions
  FROM public.user_roles ur
  JOIN public.roles r ON ur.role_id = r.id
  WHERE ur.user_id = _user_id
    AND (ur.project_id = _project_id OR ur.project_id IS NULL)
    AND ur.status = 'active'
    AND (ur.expires_at IS NULL OR ur.expires_at > now());
$$;

-- RLS Policies for roles
CREATE POLICY "Anyone can view active roles"
ON public.roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage roles"
ON public.roles FOR ALL
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_admin_user(auth.uid()) OR
  (project_id IN (
    SELECT project_id FROM project_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ))
);

CREATE POLICY "Admins and project managers can assign roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_user(auth.uid()) OR
  (project_id IN (
    SELECT project_id FROM project_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ))
);

CREATE POLICY "Admins and project managers can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (
  public.is_admin_user(auth.uid()) OR
  (project_id IN (
    SELECT project_id FROM project_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ))
);

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Insert default system roles
INSERT INTO public.roles (name, tag, description, permissions, is_system_role) VALUES
(
  'System Administrator',
  'admin_sysops',
  'Full system access with all administrative privileges',
  '{
    "system": ["manage_users", "manage_roles", "system_config"],
    "projects": ["create", "read", "update", "delete", "manage_all"],
    "finance": ["view_all", "edit_all", "export_all"],
    "reports": ["view_all", "export_all"]
  }',
  true
),
(
  'Project Manager',
  'project_manager',
  'Manages projects, budgets, and team assignments',
  '{
    "projects": ["create", "read", "update", "manage_team"],
    "finance": ["view_assigned", "edit_assigned", "export_assigned"],
    "team": ["invite", "assign_roles", "view_all"],
    "reports": ["view_assigned", "export_assigned"]
  }',
  true
),
(
  'Site Supervisor',
  'site_supervisor',
  'Oversees on-site operations and task management',
  '{
    "projects": ["read", "update_tasks", "update_progress"],
    "team": ["view_assigned", "update_tasks"],
    "reports": ["view_assigned"]
  }',
  true
),
(
  'Team Member',
  'team_member',
  'Standard team member with task execution capabilities',
  '{
    "projects": ["read_assigned", "update_own_tasks"],
    "team": ["view_assigned"],
    "reports": ["view_own"]
  }',
  true
),
(
  'Client Viewer',
  'client_viewer',
  'Read-only access for clients to view project progress',
  '{
    "projects": ["read_assigned"],
    "reports": ["view_assigned"]
  }',
  true
);

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();