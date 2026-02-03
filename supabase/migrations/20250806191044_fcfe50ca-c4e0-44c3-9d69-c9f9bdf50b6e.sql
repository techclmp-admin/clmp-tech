-- Simple role system setup

-- Create user_roles table first
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
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint
ALTER TABLE public.user_roles ADD CONSTRAINT unique_user_role_project 
UNIQUE(user_id, role_id, project_id);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT 
TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Allow role assignment" ON public.user_roles FOR INSERT 
TO authenticated WITH CHECK (true);

-- Assign admin role to current user if roles table exists and has data
DO $$
DECLARE
  admin_role_id UUID;
  current_user_id UUID;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM public.roles WHERE tag = 'admin_sysops' LIMIT 1;
  
  -- Get current user ID
  SELECT auth.uid() INTO current_user_id;
  
  -- Insert admin role for current user if both exist
  IF admin_role_id IS NOT NULL AND current_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id, assigned_by)
    VALUES (current_user_id, admin_role_id, current_user_id)
    ON CONFLICT (user_id, role_id, project_id) DO NOTHING;
  END IF;
END $$;