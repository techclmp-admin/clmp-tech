-- Add policy to allow users to remove themselves from projects (leave)
CREATE POLICY "Users can leave projects"
ON public.project_members
FOR DELETE
USING (auth.uid() = user_id);