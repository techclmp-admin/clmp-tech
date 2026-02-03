-- Add DELETE policy for project_templates (only non-system templates by owner)
CREATE POLICY "Owners can delete their templates"
ON public.project_templates
FOR DELETE
USING (
  created_by = auth.uid() 
  AND (is_system_template = false OR is_system_template IS NULL)
);