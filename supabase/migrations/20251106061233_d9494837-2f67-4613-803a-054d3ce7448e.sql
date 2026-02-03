
-- Add policy to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
  )
);

-- Add policy to allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
  )
);

-- Add policy to allow admins to delete all profiles
CREATE POLICY "Admins can delete all profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
  )
);

-- Add comments
COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS 
'Allows users with admin role in user_roles table to view all user profiles for administration purposes';

COMMENT ON POLICY "Admins can update all profiles" ON public.profiles IS 
'Allows admins to update any user profile (for banning, role changes, etc.)';

COMMENT ON POLICY "Admins can delete all profiles" ON public.profiles IS 
'Allows admins to delete user profiles when managing users';
