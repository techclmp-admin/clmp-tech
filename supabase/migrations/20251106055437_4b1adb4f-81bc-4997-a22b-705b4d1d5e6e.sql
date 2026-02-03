-- Fix Critical Security Issue: Restrict profiles table access
-- Only allow users to see their own profile and profiles of people in their projects

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create more restrictive policy that only allows:
-- 1. Users to see their own profile
-- 2. Users to see profiles of people they work with in projects
CREATE POLICY "Users can view own and team profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = id OR
  id IN (
    SELECT DISTINCT pm.user_id 
    FROM project_members pm
    WHERE pm.project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- Add comment explaining the policy
COMMENT ON POLICY "Users can view own and team profiles" ON public.profiles IS 
'Restricts profile visibility to: (1) own profile, (2) profiles of team members in shared projects. Prevents unauthorized access to email/phone data.';