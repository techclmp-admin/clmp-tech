-- Add operation_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operation_admin';

-- Create policy allowing users to update their own profile OR admins to update any profile
CREATE POLICY "Users can update own profile or admins can update any"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'system_admin'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'system_admin'::app_role)
  OR public.has_role(auth.uid(), 'admin'::app_role)
);