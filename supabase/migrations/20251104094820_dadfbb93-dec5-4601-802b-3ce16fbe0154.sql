-- Fix RLS policy for project_templates to allow authenticated users to insert templates
DROP POLICY IF EXISTS "Users can insert templates" ON public.project_templates;

CREATE POLICY "Authenticated users can insert templates"
ON public.project_templates
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);