-- Create project activity log table
CREATE TABLE IF NOT EXISTS public.project_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('member_added', 'member_removed', 'role_changed', 'project_created', 'project_updated')),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_project_activity_log_project_id ON public.project_activity_log(project_id);
CREATE INDEX idx_project_activity_log_created_at ON public.project_activity_log(created_at DESC);
CREATE INDEX idx_project_activity_log_action_type ON public.project_activity_log(action_type);

-- Enable RLS
ALTER TABLE public.project_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view activity log for their projects"
ON public.project_activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_activity_log.project_id
    AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert activity log for their projects"
ON public.project_activity_log
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_activity_log.project_id
    AND pm.user_id = auth.uid()
  )
);

-- Function to log member activity
CREATE OR REPLACE FUNCTION public.log_member_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.project_activity_log (
      project_id,
      user_id,
      action_type,
      target_user_id,
      new_value,
      metadata
    ) VALUES (
      NEW.project_id,
      COALESCE(NEW.invited_by, auth.uid()),
      'member_added',
      NEW.user_id,
      NEW.role,
      jsonb_build_object(
        'member_id', NEW.id,
        'joined_via', COALESCE(NEW.joined_via, 'direct')
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.project_activity_log (
      project_id,
      user_id,
      action_type,
      target_user_id,
      old_value,
      metadata
    ) VALUES (
      OLD.project_id,
      auth.uid(),
      'member_removed',
      OLD.user_id,
      OLD.role,
      jsonb_build_object('member_id', OLD.id)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    INSERT INTO public.project_activity_log (
      project_id,
      user_id,
      action_type,
      target_user_id,
      old_value,
      new_value,
      metadata
    ) VALUES (
      NEW.project_id,
      auth.uid(),
      'role_changed',
      NEW.user_id,
      OLD.role,
      NEW.role,
      jsonb_build_object('member_id', NEW.id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for project_members
DROP TRIGGER IF EXISTS log_member_activity_trigger ON public.project_members;
CREATE TRIGGER log_member_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.project_members
FOR EACH ROW
EXECUTE FUNCTION public.log_member_activity();

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_activity_log;