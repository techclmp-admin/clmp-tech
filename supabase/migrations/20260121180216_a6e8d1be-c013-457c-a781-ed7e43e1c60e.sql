-- Add RLS policies for expense_categories table
-- Allow authenticated users to manage expense categories

-- Policy for SELECT - all authenticated users can view categories
CREATE POLICY "Authenticated users can view expense categories" 
ON public.expense_categories 
FOR SELECT 
TO authenticated
USING (true);

-- Policy for INSERT - authenticated users can create categories
CREATE POLICY "Authenticated users can create expense categories" 
ON public.expense_categories 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Policy for UPDATE - authenticated users can update categories  
CREATE POLICY "Authenticated users can update expense categories" 
ON public.expense_categories 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for DELETE - authenticated users can delete categories
CREATE POLICY "Authenticated users can delete expense categories" 
ON public.expense_categories 
FOR DELETE 
TO authenticated
USING (true);