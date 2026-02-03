-- Clean up duplicate Finance & Budget features
-- 1. Update budget_categories to be the single source for Categories control
UPDATE global_feature_settings SET 
  feature_name = 'Categories Tab',
  description = 'Manage expense categories (tab and header button)',
  category = 'finance'
WHERE feature_key = 'budget_categories';

-- 2. Update budget_invoices to be the single source for Invoice control  
UPDATE global_feature_settings SET 
  feature_name = 'Invoices Tab',
  description = 'Manage project invoices (tab)'
WHERE feature_key = 'budget_invoices';

-- 3. Move receipt_scanner to finance category for better organization
UPDATE global_feature_settings SET 
  category = 'finance',
  parent_feature_key = 'budget_tracking',
  description = 'OCR scanning for expense receipts'
WHERE feature_key = 'receipt_scanner';

-- 4. Delete duplicate features that are no longer needed
DELETE FROM global_feature_settings WHERE feature_key = 'expense_categories';
DELETE FROM global_feature_settings WHERE feature_key = 'invoice_management';