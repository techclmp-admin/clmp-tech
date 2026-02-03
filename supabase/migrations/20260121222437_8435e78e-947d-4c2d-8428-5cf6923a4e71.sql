-- 1. Delete duplicate features
DELETE FROM public.global_feature_settings 
WHERE feature_key IN ('file_manager', 'ai_risk_analysis');

-- 2. Move Dashboard to 'app' category
UPDATE public.global_feature_settings 
SET category = 'app', sort_order = 0
WHERE feature_key = 'dashboard';

-- 3. Update descriptions to be clearer and avoid confusion

-- Project Documents Tab = tab in Project Details page
UPDATE public.global_feature_settings 
SET feature_name = 'Documents Tab', 
    description = 'Documents tab within Project Details page'
WHERE feature_key = 'project_documents_tab';

-- File Management = standalone File Manager page
UPDATE public.global_feature_settings 
SET feature_name = 'Document Manager',
    description = 'Standalone document manager page (/files)'
WHERE feature_key = 'file_management';

-- Project Calendar Tab = tab in Project Details
UPDATE public.global_feature_settings 
SET feature_name = 'Calendar Tab',
    description = 'Calendar tab within Project Details page'
WHERE feature_key = 'project_calendar_tab';

-- Calendar View = standalone Calendar page
UPDATE public.global_feature_settings 
SET description = 'Standalone calendar page (/calendar)'
WHERE feature_key = 'calendar_view';

-- Project Tasks Tab = tab in Project Details
UPDATE public.global_feature_settings 
SET feature_name = 'Tasks Tab',
    description = 'Tasks tab within Project Details page'
WHERE feature_key = 'project_tasks_tab';

-- Task Management = standalone task features (Kanban, Gantt, etc.)
UPDATE public.global_feature_settings 
SET description = 'Task creation, assignment, and tracking features'
WHERE feature_key = 'task_management';

-- AI Risk Management - clarify it controls Alerts page
UPDATE public.global_feature_settings 
SET feature_name = 'AI Risk Alerts',
    description = 'AI-powered project risk analysis and alerts (/alerts)'
WHERE feature_key = 'ai_risk_management';

-- Update sub-feature names for clarity
UPDATE public.global_feature_settings 
SET feature_name = 'Overview Tab'
WHERE feature_key = 'alerts_overview';

UPDATE public.global_feature_settings 
SET feature_name = 'By Project Tab'
WHERE feature_key = 'alerts_by_project';

UPDATE public.global_feature_settings 
SET feature_name = 'All Alerts Tab'
WHERE feature_key = 'alerts_all';

UPDATE public.global_feature_settings 
SET feature_name = 'Weather Tab'
WHERE feature_key = 'alerts_weather';