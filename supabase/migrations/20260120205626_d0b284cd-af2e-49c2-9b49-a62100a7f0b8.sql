-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create new policy that allows both admin types to manage roles
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_any_admin(auth.uid()))
WITH CHECK (public.is_any_admin(auth.uid()));