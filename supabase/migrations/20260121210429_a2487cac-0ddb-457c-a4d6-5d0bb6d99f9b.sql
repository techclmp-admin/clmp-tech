-- Fix RLS so System Admin can update global feature settings
-- Existing policy only allowed app_role 'admin', which blocks 'system_admin'

-- Ensure RLS is enabled (should already be)
ALTER TABLE public.global_feature_settings ENABLE ROW LEVEL SECURITY;

-- Drop overly restrictive/incorrect policy
DROP POLICY IF EXISTS "Admins can manage features" ON public.global_feature_settings;

-- Create correct policy: only System Admins can manage feature settings
CREATE POLICY "System admins can manage global feature settings"
ON public.global_feature_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'system_admin'::public.app_role));
