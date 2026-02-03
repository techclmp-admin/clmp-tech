-- Create expenses table to track individual expense entries
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.project_budgets(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor TEXT,
  receipt_url TEXT,
  payment_method TEXT,
  currency TEXT NOT NULL DEFAULT 'CAD',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view expenses for their projects"
ON public.expenses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = expenses.project_id
    AND pm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = expenses.project_id
    AND p.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create expenses for their projects"
ON public.expenses
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = expenses.project_id
      AND pm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = expenses.project_id
      AND p.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own expenses"
ON public.expenses
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own expenses"
ON public.expenses
FOR DELETE
USING (created_by = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX idx_expenses_budget_id ON public.expenses(budget_id);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);

-- Create function to update project_budgets actual_amount when expense is added/modified
CREATE OR REPLACE FUNCTION public.update_budget_actual_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.project_budgets
    SET actual_amount = COALESCE(actual_amount, 0) + NEW.amount,
        updated_at = now()
    WHERE id = NEW.budget_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.budget_id = NEW.budget_id THEN
    UPDATE public.project_budgets
    SET actual_amount = COALESCE(actual_amount, 0) - OLD.amount + NEW.amount,
        updated_at = now()
    WHERE id = NEW.budget_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.budget_id != NEW.budget_id THEN
    -- Decrease old budget
    UPDATE public.project_budgets
    SET actual_amount = COALESCE(actual_amount, 0) - OLD.amount,
        updated_at = now()
    WHERE id = OLD.budget_id;
    -- Increase new budget
    UPDATE public.project_budgets
    SET actual_amount = COALESCE(actual_amount, 0) + NEW.amount,
        updated_at = now()
    WHERE id = NEW.budget_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.project_budgets
    SET actual_amount = COALESCE(actual_amount, 0) - OLD.amount,
        updated_at = now()
    WHERE id = OLD.budget_id;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update budget actual_amount
CREATE TRIGGER update_budget_on_expense_change
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_budget_actual_amount();