-- Create OBC compliance tracking table
CREATE TABLE IF NOT EXISTS public.obc_compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- structural, fire, health, building_envelope, energy, accessibility
  item_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_review, approved, rejected
  authority TEXT,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  due_date DATE,
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create safety compliance tracking table
CREATE TABLE IF NOT EXISTS public.safety_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- ohsa, ppe, training, site_safety
  item_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'current', -- current, expiring, expired
  expiry_date DATE,
  workers_count INTEGER,
  compliance_percentage INTEGER DEFAULT 100,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create safety incidents table
CREATE TABLE IF NOT EXISTS public.safety_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL,
  incident_type TEXT NOT NULL, -- near_miss, first_aid, medical_aid, lost_time, property_damage
  severity TEXT NOT NULL, -- low, medium, high, critical
  description TEXT NOT NULL,
  location TEXT,
  corrective_action TEXT,
  action_status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  reported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create inspections table
CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  permit_id UUID REFERENCES public.permits(id),
  inspection_type TEXT NOT NULL,
  phase TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, pending, passed, conditional, failed
  inspection_date DATE NOT NULL,
  inspector_name TEXT,
  inspector_authority TEXT,
  result TEXT,
  deficiencies JSONB,
  notes TEXT,
  reinspection_date DATE,
  next_inspection TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create compliance documents table
CREATE TABLE IF NOT EXISTS public.compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- permit, inspection, safety, certification
  document_name TEXT NOT NULL,
  file_path TEXT,
  expiry_date DATE,
  status TEXT DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.obc_compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for obc_compliance_items
CREATE POLICY "Users can view OBC compliance for their projects"
ON public.obc_compliance_items FOR SELECT
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = obc_compliance_items.project_id
  )
);

CREATE POLICY "Users can insert OBC compliance for their projects"
ON public.obc_compliance_items FOR INSERT
TO public
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = obc_compliance_items.project_id
  )
);

CREATE POLICY "Users can update OBC compliance for their projects"
ON public.obc_compliance_items FOR UPDATE
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = obc_compliance_items.project_id
  )
);

CREATE POLICY "Users can delete OBC compliance for their projects"
ON public.obc_compliance_items FOR DELETE
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = obc_compliance_items.project_id
  )
);

-- RLS Policies for safety_compliance
CREATE POLICY "Users can view safety compliance for their projects"
ON public.safety_compliance FOR SELECT
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = safety_compliance.project_id
  )
);

CREATE POLICY "Users can insert safety compliance for their projects"
ON public.safety_compliance FOR INSERT
TO public
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = safety_compliance.project_id
  )
);

CREATE POLICY "Users can update safety compliance for their projects"
ON public.safety_compliance FOR UPDATE
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = safety_compliance.project_id
  )
);

CREATE POLICY "Users can delete safety compliance for their projects"
ON public.safety_compliance FOR DELETE
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = safety_compliance.project_id
  )
);

-- RLS Policies for safety_incidents
CREATE POLICY "Users can view safety incidents for their projects"
ON public.safety_incidents FOR SELECT
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = safety_incidents.project_id
  )
);

CREATE POLICY "Users can insert safety incidents for their projects"
ON public.safety_incidents FOR INSERT
TO public
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = safety_incidents.project_id
  )
);

CREATE POLICY "Users can update safety incidents for their projects"
ON public.safety_incidents FOR UPDATE
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = safety_incidents.project_id
  )
);

-- RLS Policies for inspections
CREATE POLICY "Users can view inspections for their projects"
ON public.inspections FOR SELECT
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = inspections.project_id
  )
);

CREATE POLICY "Users can insert inspections for their projects"
ON public.inspections FOR INSERT
TO public
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = inspections.project_id
  )
);

CREATE POLICY "Users can update inspections for their projects"
ON public.inspections FOR UPDATE
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = inspections.project_id
  )
);

-- RLS Policies for compliance_documents
CREATE POLICY "Users can view compliance docs for their projects"
ON public.compliance_documents FOR SELECT
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = compliance_documents.project_id
  )
);

CREATE POLICY "Users can insert compliance docs for their projects"
ON public.compliance_documents FOR INSERT
TO public
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = compliance_documents.project_id
  )
);

CREATE POLICY "Users can update compliance docs for their projects"
ON public.compliance_documents FOR UPDATE
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = compliance_documents.project_id
  )
);

CREATE POLICY "Users can delete compliance docs for their projects"
ON public.compliance_documents FOR DELETE
TO public
USING (
  auth.uid() IN (
    SELECT user_id FROM public.project_members WHERE project_id = compliance_documents.project_id
  )
);

-- Create indexes for better performance
CREATE INDEX idx_obc_compliance_project ON public.obc_compliance_items(project_id);
CREATE INDEX idx_obc_compliance_status ON public.obc_compliance_items(status);
CREATE INDEX idx_safety_compliance_project ON public.safety_compliance(project_id);
CREATE INDEX idx_safety_incidents_project ON public.safety_incidents(project_id);
CREATE INDEX idx_inspections_project ON public.inspections(project_id);
CREATE INDEX idx_inspections_status ON public.inspections(status);
CREATE INDEX idx_compliance_docs_project ON public.compliance_documents(project_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_obc_compliance_updated_at
  BEFORE UPDATE ON public.obc_compliance_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safety_compliance_updated_at
  BEFORE UPDATE ON public.safety_compliance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safety_incidents_updated_at
  BEFORE UPDATE ON public.safety_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_documents_updated_at
  BEFORE UPDATE ON public.compliance_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();