-- Create weather alerts and risk management tables
CREATE TABLE public.weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('severe_weather', 'wind', 'rain', 'temperature', 'visibility', 'equipment_risk')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  weather_data JSONB,
  ai_analysis JSONB,
  recommended_actions TEXT[],
  is_active BOOLEAN DEFAULT true,
  resolved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('weather', 'safety', 'equipment', 'schedule')),
  risk_score DECIMAL(3,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
  risk_factors JSONB NOT NULL DEFAULT '[]',
  mitigation_strategies TEXT[],
  ai_recommendations JSONB,
  weather_conditions JSONB,
  created_by UUID REFERENCES auth.users(id),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;

-- Weather alerts policies
CREATE POLICY "Project members can view weather alerts" ON public.weather_alerts
  FOR SELECT USING (
    project_id IN (
      SELECT pm.project_id FROM public.project_members pm 
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can manage weather alerts" ON public.weather_alerts
  FOR ALL USING (
    project_id IN (
      SELECT pm.project_id FROM public.project_members pm 
      WHERE pm.user_id = auth.uid() AND pm.role IN ('admin', 'manager')
    )
  );

-- Risk assessments policies  
CREATE POLICY "Project members can view risk assessments" ON public.risk_assessments
  FOR SELECT USING (
    project_id IN (
      SELECT pm.project_id FROM public.project_members pm 
      WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can manage risk assessments" ON public.risk_assessments
  FOR ALL USING (
    project_id IN (
      SELECT pm.project_id FROM public.project_members pm 
      WHERE pm.user_id = auth.uid() AND pm.role IN ('admin', 'manager')
    )
  );

-- Update triggers
CREATE OR REPLACE FUNCTION update_weather_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_weather_alerts_updated_at
  BEFORE UPDATE ON public.weather_alerts
  FOR EACH ROW EXECUTE FUNCTION update_weather_alerts_updated_at();

CREATE OR REPLACE FUNCTION update_risk_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_risk_assessments_updated_at
  BEFORE UPDATE ON public.risk_assessments
  FOR EACH ROW EXECUTE FUNCTION update_risk_assessments_updated_at();