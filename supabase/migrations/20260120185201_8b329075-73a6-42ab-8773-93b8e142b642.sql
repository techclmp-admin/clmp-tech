-- Allow invited users to INSERT themselves into project_members when accepting invitation
-- This policy checks that:
-- 1. User is inserting their own user_id
-- 2. There's a valid pending invitation for this user to this project

CREATE POLICY "Invited users can join projects"
ON public.project_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.is_invited_to_project(project_id, (auth.jwt() ->> 'email'))
);