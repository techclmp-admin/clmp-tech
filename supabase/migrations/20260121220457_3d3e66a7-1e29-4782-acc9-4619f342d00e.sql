-- Move all budget sub-features to finance category for unified Admin panel display
UPDATE global_feature_settings SET category = 'finance' 
WHERE feature_key IN ('budget_invoices', 'budget_analytics', 'budget_trends', 'budget_forecasting', 'budget_tax_calculator');