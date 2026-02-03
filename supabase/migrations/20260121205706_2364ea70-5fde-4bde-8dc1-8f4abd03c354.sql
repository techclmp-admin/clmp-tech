-- Delete duplicate feature settings
DELETE FROM global_feature_settings 
WHERE feature_key IN (
  'compliance_obc',        -- duplicate of obc_compliance
  'compliance_permits',    -- duplicate of permit_tracking
  'compliance_inspections', -- duplicate of inspection_tracking
  'templates'              -- duplicate of project_templates
);