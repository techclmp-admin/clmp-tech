-- Add missing columns to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS current_phase VARCHAR(100);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Update expenses table to ensure all columns exist
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_date DATE DEFAULT CURRENT_DATE;

-- Update budgets table
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS remaining_amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS spent_amount DECIMAL(15,2) DEFAULT 0;

-- Update safety_compliance table  
ALTER TABLE public.safety_compliance ADD COLUMN IF NOT EXISTS compliance_percentage INTEGER DEFAULT 0;