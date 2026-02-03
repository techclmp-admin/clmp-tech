-- Create minimal user_roles table

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "user_roles_select_policy" ON public.user_roles FOR SELECT 
TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user_roles_insert_policy" ON public.user_roles FOR INSERT 
TO authenticated WITH CHECK (true);