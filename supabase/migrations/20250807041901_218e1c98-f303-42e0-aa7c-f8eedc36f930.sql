-- Create chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create permits table
CREATE TABLE public.permits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_number text NOT NULL,
  permit_type text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  application_date date NOT NULL,
  approval_date date,
  expiry_date date,
  issuing_authority text NOT NULL,
  contact_person text,
  contact_email text,
  contact_phone text,
  fee_amount decimal,
  payment_status text NOT NULL DEFAULT 'pending',
  conditions text,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create permit workflow steps table  
CREATE TABLE public.permit_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id uuid REFERENCES public.permits(id) ON DELETE CASCADE,
  step_name text NOT NULL,
  step_order integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  assigned_to uuid REFERENCES auth.users(id),
  due_date timestamptz,
  completed_date timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create export history table
CREATE TABLE public.export_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  file_url text,
  record_count integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create MFA settings table
CREATE TABLE public.user_mfa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  phone_number text,
  phone_verified boolean DEFAULT false,
  backup_codes jsonb DEFAULT '[]',
  last_used_at timestamptz,
  last_used_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permit_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view chat messages in their rooms" ON public.chat_messages
  FOR SELECT USING (chat_room_id IN (
    SELECT chat_room_id FROM public.chat_participants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert chat messages in their rooms" ON public.chat_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid() AND chat_room_id IN (
    SELECT chat_room_id FROM public.chat_participants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Project members can view permits" ON public.permits
  FOR SELECT USING (project_id IN (
    SELECT project_id FROM public.project_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Project admins can manage permits" ON public.permits
  FOR ALL USING (project_id IN (
    SELECT project_id FROM public.project_members 
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ));

CREATE POLICY "Users can view their own export history" ON public.export_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own MFA settings" ON public.user_mfa_settings
  FOR ALL USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX idx_chat_messages_room ON public.chat_messages(chat_room_id);
CREATE INDEX idx_permits_project ON public.permits(project_id);
CREATE INDEX idx_permit_workflow_permit ON public.permit_workflow_steps(permit_id);