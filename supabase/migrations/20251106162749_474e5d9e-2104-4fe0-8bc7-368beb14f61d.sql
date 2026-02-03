-- Create rejoin_requests table
CREATE TABLE IF NOT EXISTS public.rejoin_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, user_id, status)
);

-- Enable RLS
ALTER TABLE public.rejoin_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own rejoin requests"
ON public.rejoin_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create rejoin requests
CREATE POLICY "Users can create rejoin requests"
ON public.rejoin_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Project admins can view all requests for their projects
CREATE POLICY "Project admins can view rejoin requests"
ON public.rejoin_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = rejoin_requests.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('owner', 'admin')
  )
);

-- Project admins can update requests
CREATE POLICY "Project admins can update rejoin requests"
ON public.rejoin_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_members.project_id = rejoin_requests.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('owner', 'admin')
  )
);

-- Create index for faster lookups
CREATE INDEX idx_rejoin_requests_project_user ON public.rejoin_requests(project_id, user_id);
CREATE INDEX idx_rejoin_requests_status ON public.rejoin_requests(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rejoin_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_rejoin_requests_updated_at
BEFORE UPDATE ON public.rejoin_requests
FOR EACH ROW
EXECUTE FUNCTION update_rejoin_requests_updated_at();