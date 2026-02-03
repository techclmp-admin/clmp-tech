-- Create expense categories for CRA compliance
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cra_code TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  parent_category_id UUID REFERENCES public.expense_categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.expense_categories(id),
  budgeted_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (budgeted_amount - spent_amount) STORED,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  vendor_name TEXT NOT NULL,
  vendor_address TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  hst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date DATE,
  category_id UUID REFERENCES public.expense_categories(id),
  attachments JSONB DEFAULT '[]',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CRA reports table
CREATE TABLE public.cra_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('gst_hst', 'expense_summary', 'tax_summary', 'annual_summary')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  total_gst DECIMAL(12,2) DEFAULT 0,
  total_hst DECIMAL(12,2) DEFAULT 0,
  total_expenses DECIMAL(12,2) DEFAULT 0,
  generated_by UUID NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cra_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
CREATE POLICY "Authenticated users can view expense categories"
ON public.expense_categories FOR SELECT
TO authenticated
USING (is_active = true);

-- RLS Policies for budgets
CREATE POLICY "Project members can view budgets"
ON public.budgets FOR SELECT
TO authenticated
USING (project_id IN (
  SELECT project_id FROM project_members 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Project members can manage budgets"
ON public.budgets FOR ALL
TO authenticated
USING (project_id IN (
  SELECT project_id FROM project_members 
  WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
))
WITH CHECK (project_id IN (
  SELECT project_id FROM project_members 
  WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
));

-- RLS Policies for invoices
CREATE POLICY "Project members can view invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (project_id IN (
  SELECT project_id FROM project_members 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Project members can manage invoices"
ON public.invoices FOR ALL
TO authenticated
USING (project_id IN (
  SELECT project_id FROM project_members 
  WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
))
WITH CHECK (project_id IN (
  SELECT project_id FROM project_members 
  WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
));

-- RLS Policies for CRA reports
CREATE POLICY "Project members can view CRA reports"
ON public.cra_reports FOR SELECT
TO authenticated
USING (project_id IN (
  SELECT project_id FROM project_members 
  WHERE user_id = auth.uid()
) OR project_id IS NULL);

CREATE POLICY "Project members can generate CRA reports"
ON public.cra_reports FOR INSERT
TO authenticated
WITH CHECK (generated_by = auth.uid());

-- Insert default expense categories for CRA compliance
INSERT INTO public.expense_categories (name, cra_code, description) VALUES
('Materials', 'MAT', 'Construction materials and supplies'),
('Labour', 'LAB', 'Direct labour costs'),
('Equipment', 'EQP', 'Equipment rental and purchases'),
('Subcontractors', 'SUB', 'Subcontractor payments'),
('Professional Services', 'PROF', 'Professional consulting and services'),
('Insurance', 'INS', 'Project insurance costs'),
('Permits and Fees', 'PERM', 'Government permits and regulatory fees'),
('Transportation', 'TRANS', 'Transportation and delivery costs'),
('Utilities', 'UTIL', 'Utilities for project sites'),
('Overhead', 'OH', 'Project overhead expenses');

-- Create function to calculate GST/HST
CREATE OR REPLACE FUNCTION calculate_tax_amounts(
  subtotal DECIMAL,
  province TEXT DEFAULT 'ON'
) RETURNS TABLE (
  gst_amount DECIMAL,
  hst_amount DECIMAL,
  total_amount DECIMAL
) 
LANGUAGE plpgsql
AS $$
DECLARE
  gst_rate DECIMAL := 0.05; -- 5% GST
  hst_rate DECIMAL := 0.13; -- 13% HST for Ontario
BEGIN
  -- HST provinces: ON, NB, NL, NS, PE (13%)
  -- GST + PST provinces: BC, SK, MB, QC, AB, NT, NU, YT (5% GST + varying PST)
  
  IF province IN ('ON', 'NB', 'NL', 'NS', 'PE') THEN
    -- HST provinces
    RETURN QUERY SELECT 
      0::DECIMAL as gst_amount,
      (subtotal * hst_rate)::DECIMAL as hst_amount,
      (subtotal * (1 + hst_rate))::DECIMAL as total_amount;
  ELSE
    -- GST provinces (simplified - in real app would need PST calculations)
    RETURN QUERY SELECT 
      (subtotal * gst_rate)::DECIMAL as gst_amount,
      0::DECIMAL as hst_amount,
      (subtotal * (1 + gst_rate))::DECIMAL as total_amount;
  END IF;
END;
$$;

-- Create trigger to update invoice totals
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS trigger AS $$
BEGIN
  -- Update tax amounts based on subtotal
  SELECT gst_amount, hst_amount, total_amount 
  INTO NEW.gst_amount, NEW.hst_amount, NEW.total_amount
  FROM calculate_tax_amounts(NEW.subtotal, 'ON'); -- Default to Ontario
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_totals
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_totals();