
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'pm', 'site', 'viewer');
CREATE TYPE project_type AS ENUM ('residential', 'commercial', 'infrastructure');
CREATE TYPE project_status AS ENUM ('planned', 'active', 'on_hold', 'completed', 'cancelled');
CREATE TYPE task_status AS ENUM ('planned', 'in_progress', 'completed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE alert_type AS ENUM ('weather', 'permit', 'delay', 'budget');
CREATE TYPE alert_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE cost_category AS ENUM ('materials', 'labor', 'equipment', 'permits', 'other');
CREATE TYPE permit_status AS ENUM ('pending', 'approved', 'expired', 'denied');

-- Update profiles table to include CLMP specific fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'viewer';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Toronto';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_name VARCHAR(255),
  project_type project_type NOT NULL,
  status project_status DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2) DEFAULT 0,
  actual_cost DECIMAL(12,2) DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  address TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members (team assignments)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'planned',
  priority task_priority DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2) DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  position INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  dependencies UUID[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget items
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category cost_category NOT NULL,
  description TEXT NOT NULL,
  estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  actual_cost DECIMAL(10,2) DEFAULT 0,
  gst_rate DECIMAL(5,4) DEFAULT 0.05,
  pst_rate DECIMAL(5,4) DEFAULT 0,
  hst_rate DECIMAL(5,4) DEFAULT 0,
  province VARCHAR(2) DEFAULT 'ON',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permits tracking
CREATE TABLE IF NOT EXISTS permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  permit_name VARCHAR(255) NOT NULL,
  permit_number VARCHAR(100),
  status permit_status DEFAULT 'pending',
  application_date DATE,
  approval_date DATE,
  expiry_date DATE,
  issuing_authority VARCHAR(255),
  cost DECIMAL(10,2) DEFAULT 0,
  documents JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Risk alerts
CREATE TABLE IF NOT EXISTS risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  alert_type alert_type NOT NULL,
  priority alert_priority DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  auto_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity feed
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team invitations
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token UUID DEFAULT gen_random_uuid(),
  status VARCHAR(20) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File attachments
CREATE TABLE IF NOT EXISTS file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project templates
CREATE TABLE IF NOT EXISTS project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  project_type project_type NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL DEFAULT '{}',
  is_system_template BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  dashboard_layout JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{"email": true, "slack": false}',
  theme VARCHAR(20) DEFAULT 'light',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects they are members of" ON projects
  FOR SELECT USING (
    id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    ) OR created_by = auth.uid() OR project_manager_id = auth.uid()
  );

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Project managers and admins can update projects" ON projects
  FOR UPDATE USING (
    project_manager_id = auth.uid() OR created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for project_members
CREATE POLICY "Users can view project members for their projects" ON project_members
  FOR SELECT USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can manage members" ON project_members
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.project_manager_id = auth.uid() OR p.created_by = auth.uid()
    )
  );

-- RLS Policies for project_tasks
CREATE POLICY "Users can view tasks for their projects" ON project_tasks
  FOR SELECT USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can create tasks" ON project_tasks
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks assigned to them or if they are PM" ON project_tasks
  FOR UPDATE USING (
    assigned_to = auth.uid() OR created_by = auth.uid() OR
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.project_manager_id = auth.uid() OR p.created_by = auth.uid()
    )
  );

-- RLS Policies for budget_items
CREATE POLICY "Users can view budget items for their projects" ON budget_items
  FOR SELECT USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can manage budget items" ON budget_items
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.project_manager_id = auth.uid() OR p.created_by = auth.uid()
    )
  );

-- RLS Policies for other tables (similar pattern)
CREATE POLICY "Users can view permits for their projects" ON permits
  FOR SELECT USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can manage permits" ON permits
  FOR ALL USING (
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.project_manager_id = auth.uid() OR p.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view alerts for their projects" ON risk_alerts
  FOR SELECT USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can dismiss alerts" ON risk_alerts
  FOR UPDATE USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view activity logs for their projects" ON activity_logs
  FOR SELECT USING (
    project_id IN (
      SELECT pm.project_id FROM project_members pm WHERE pm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Everyone can view system project templates" ON project_templates
  FOR SELECT USING (is_system_template = true);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON budget_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permits_updated_at BEFORE UPDATE ON permits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_alerts_updated_at BEFORE UPDATE ON risk_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default project templates
INSERT INTO project_templates (name, project_type, description, template_data) VALUES
('Residential Construction', 'residential', 'Standard residential project template', '{
  "phases": ["Planning", "Foundation", "Framing", "Systems", "Finishing", "Landscaping"],
  "typical_tasks": [
    {"title": "Obtain Building Permit", "phase": "Planning", "priority": "high"},
    {"title": "Site Preparation", "phase": "Foundation", "priority": "medium"},
    {"title": "Foundation Pour", "phase": "Foundation", "priority": "high"},
    {"title": "Frame Walls", "phase": "Framing", "priority": "medium"},
    {"title": "Electrical Rough-in", "phase": "Systems", "priority": "medium"},
    {"title": "Plumbing Rough-in", "phase": "Systems", "priority": "medium"},
    {"title": "Drywall Installation", "phase": "Finishing", "priority": "low"},
    {"title": "Final Inspection", "phase": "Finishing", "priority": "high"}
  ],
  "typical_permits": ["Building Permit", "Electrical Permit", "Plumbing Permit"]
}'),
('Commercial Build-out', 'commercial', 'Commercial interior build-out template', '{
  "phases": ["Design", "Permits", "Demolition", "Construction", "Systems", "Finishing"],
  "typical_tasks": [
    {"title": "Design Review", "phase": "Design", "priority": "high"},
    {"title": "Permit Applications", "phase": "Permits", "priority": "high"},
    {"title": "Demolition Work", "phase": "Demolition", "priority": "medium"},
    {"title": "Structural Work", "phase": "Construction", "priority": "high"},
    {"title": "HVAC Installation", "phase": "Systems", "priority": "medium"},
    {"title": "Electrical Installation", "phase": "Systems", "priority": "medium"},
    {"title": "Flooring Installation", "phase": "Finishing", "priority": "low"},
    {"title": "Occupancy Permit", "phase": "Finishing", "priority": "high"}
  ],
  "typical_permits": ["Building Permit", "Electrical Permit", "HVAC Permit", "Occupancy Permit"]
}'),
('Infrastructure Project', 'infrastructure', 'Public infrastructure project template', '{
  "phases": ["Planning", "Environmental", "Engineering", "Construction", "Testing", "Commissioning"],
  "typical_tasks": [
    {"title": "Environmental Assessment", "phase": "Environmental", "priority": "high"},
    {"title": "Engineering Design", "phase": "Engineering", "priority": "high"},
    {"title": "Public Consultation", "phase": "Planning", "priority": "medium"},
    {"title": "Site Preparation", "phase": "Construction", "priority": "medium"},
    {"title": "Main Construction", "phase": "Construction", "priority": "high"},
    {"title": "System Testing", "phase": "Testing", "priority": "high"},
    {"title": "Final Commissioning", "phase": "Commissioning", "priority": "high"}
  ],
  "typical_permits": ["Environmental Permit", "Construction Permit", "Utility Permits"]
}');
