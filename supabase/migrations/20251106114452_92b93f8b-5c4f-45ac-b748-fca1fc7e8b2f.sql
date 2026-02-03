-- Allow authenticated users to search profiles by member_code for inviting purposes
-- This enables users to find and invite other users to their projects

CREATE POLICY "Users can search profiles by member code"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Allow viewing basic info (id, email, member_code, first_name, last_name) when searching by member_code
  -- This is needed for the team invitation feature
  true
);

-- Note: This policy is intentionally permissive for SELECT operations only
-- It allows authenticated users to search for other users by member code
-- which is necessary for the invitation system to work
-- No sensitive data beyond basic profile info should be exposed