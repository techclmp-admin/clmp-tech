-- Create QuickBooks integration tables
CREATE TABLE public.quickbooks_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id TEXT NOT NULL,
  company_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  realmId TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error', 'success')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sync logs table
CREATE TABLE public.quickbooks_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.quickbooks_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('customers', 'invoices', 'expenses', 'payments', 'projects')),
  direction TEXT NOT NULL CHECK (direction IN ('export', 'import', 'bidirectional')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  records_processed INTEGER DEFAULT 0,
  records_success INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create export mappings table
CREATE TABLE public.quickbooks_export_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.quickbooks_integrations(id) ON DELETE CASCADE,
  local_entity_type TEXT NOT NULL CHECK (local_entity_type IN ('project', 'invoice', 'expense', 'customer', 'payment')),
  local_entity_id UUID NOT NULL,
  quickbooks_entity_type TEXT NOT NULL,
  quickbooks_entity_id TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sync_version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(integration_id, local_entity_type, local_entity_id)
);

-- Create export settings table
CREATE TABLE public.quickbooks_export_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.quickbooks_integrations(id) ON DELETE CASCADE,
  auto_sync_enabled BOOLEAN DEFAULT false,
  sync_frequency TEXT DEFAULT 'manual' CHECK (sync_frequency IN ('manual', 'hourly', 'daily', 'weekly')),
  export_customers BOOLEAN DEFAULT true,
  export_invoices BOOLEAN DEFAULT true,
  export_expenses BOOLEAN DEFAULT true,
  export_payments BOOLEAN DEFAULT true,
  export_projects_as_customers BOOLEAN DEFAULT true,
  default_income_account_ref TEXT,
  default_expense_account_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(integration_id)
);

-- Enable RLS
ALTER TABLE public.quickbooks_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_export_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quickbooks_export_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own QuickBooks integrations" 
ON public.quickbooks_integrations 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sync logs" 
ON public.quickbooks_sync_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.quickbooks_integrations qi 
    WHERE qi.id = integration_id AND qi.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own export mappings" 
ON public.quickbooks_export_mappings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.quickbooks_integrations qi 
    WHERE qi.id = integration_id AND qi.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own export settings" 
ON public.quickbooks_export_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.quickbooks_integrations qi 
    WHERE qi.id = integration_id AND qi.user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_quickbooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_quickbooks_integrations_updated_at
BEFORE UPDATE ON public.quickbooks_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_quickbooks_updated_at();

CREATE TRIGGER update_quickbooks_export_mappings_updated_at
BEFORE UPDATE ON public.quickbooks_export_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_quickbooks_updated_at();

CREATE TRIGGER update_quickbooks_export_settings_updated_at
BEFORE UPDATE ON public.quickbooks_export_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_quickbooks_updated_at();