-- Create project_budgets table
CREATE TABLE IF NOT EXISTS public.project_budgets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    budgeted_amount DECIMAL(15,2) DEFAULT 0,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.expense_categories(id),
    budget_id UUID REFERENCES public.project_budgets(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    vendor VARCHAR(255),
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_budgets
CREATE POLICY "Users can view project budgets" ON public.project_budgets
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_budgets.project_id AND pm.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_budgets.project_id AND p.owner_id = auth.uid())
    );

CREATE POLICY "Users can manage project budgets" ON public.project_budgets
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_budgets.project_id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'admin', 'manager'))
        OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_budgets.project_id AND p.owner_id = auth.uid())
    );

-- RLS Policies for expense_categories
CREATE POLICY "Anyone can view expense categories" ON public.expense_categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage expense categories" ON public.expense_categories
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for expenses
CREATE POLICY "Users can view project expenses" ON public.expenses
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = expenses.project_id AND pm.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = expenses.project_id AND p.owner_id = auth.uid())
    );

CREATE POLICY "Users can manage project expenses" ON public.expenses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = expenses.project_id AND pm.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = expenses.project_id AND p.owner_id = auth.uid())
    );

-- Insert default expense categories
INSERT INTO public.expense_categories (name, description, color) VALUES
    ('Materials', 'Building materials and supplies', '#3B82F6'),
    ('Labor', 'Labor costs and wages', '#10B981'),
    ('Equipment', 'Equipment rental and purchase', '#F59E0B'),
    ('Permits', 'Permits and licenses', '#8B5CF6'),
    ('Subcontractors', 'Subcontractor payments', '#EF4444'),
    ('Utilities', 'Utility expenses', '#06B6D4'),
    ('Insurance', 'Insurance premiums', '#EC4899'),
    ('Other', 'Miscellaneous expenses', '#6B7280')
ON CONFLICT DO NOTHING;

-- Create triggers for updated_at
CREATE TRIGGER update_project_budgets_updated_at
    BEFORE UPDATE ON public.project_budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at
    BEFORE UPDATE ON public.expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();