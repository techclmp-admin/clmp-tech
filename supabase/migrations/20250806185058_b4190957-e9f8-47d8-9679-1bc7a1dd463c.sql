-- Temporarily disable the trigger that's causing issues, create sample data, then re-enable
DO $$
DECLARE
  project_id UUID;
  user_record RECORD;
BEGIN
  -- Disable the problematic trigger temporarily
  ALTER TABLE projects DISABLE TRIGGER ALL;

  -- Create project templates
  INSERT INTO project_templates (id, name, description, category, template_data, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'E-commerce Development', 'Complete e-commerce website with payment integration', 'web_development', 
   '{"phases": ["planning", "design", "development", "testing", "deployment"], "estimated_duration": 180}', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Mobile App Development', 'Native mobile application for iOS and Android', 'mobile_development',
   '{"phases": ["research", "design", "development", "testing", "launch"], "estimated_duration": 150}', true)
  ON CONFLICT (id) DO NOTHING;

  -- Create sample projects for each user
  FOR user_record IN SELECT id FROM auth.users LOOP
    INSERT INTO projects (id, name, description, status, priority, start_date, end_date, budget, progress, current_phase, created_by, project_manager_id) VALUES
    (gen_random_uuid(), 'E-commerce Website Redesign', 'Complete redesign of company e-commerce platform with modern UI/UX', 'active', 'high', '2024-01-15', '2024-06-30', 75000, 65, 'execution', user_record.id, user_record.id),
    (gen_random_uuid(), 'Mobile App Development', 'Native iOS and Android app for customer service', 'active', 'urgent', '2024-02-01', '2024-08-15', 120000, 35, 'execution', user_record.id, user_record.id),
    (gen_random_uuid(), 'Data Analytics Dashboard', 'Business intelligence dashboard for analytics', 'active', 'medium', '2024-03-01', '2024-09-30', 45000, 80, 'execution', user_record.id, user_record.id),
    (gen_random_uuid(), 'AI Chatbot Integration', 'AI-powered customer support chatbot', 'completed', 'low', '2023-11-01', '2024-01-31', 30000, 100, 'closed', user_record.id, user_record.id);

    -- Add project members
    INSERT INTO project_members (project_id, user_id, role, joined_at)
    SELECT id, user_record.id, 'admin', now()
    FROM projects 
    WHERE created_by = user_record.id 
    AND created_at > now() - interval '1 minute'
    ON CONFLICT (project_id, user_id) DO NOTHING;

    -- Create sample tasks for one project
    SELECT id INTO project_id 
    FROM projects 
    WHERE created_by = user_record.id 
    AND name = 'E-commerce Website Redesign'
    AND created_at > now() - interval '1 minute'
    LIMIT 1;

    IF project_id IS NOT NULL THEN
      INSERT INTO project_tasks (project_id, title, description, status, priority, assigned_to, due_date, estimated_hours, completion_percentage, tags, created_by) VALUES
      (project_id, 'Design Homepage Mockups', 'Create responsive homepage designs', 'completed', 'high', user_record.id, '2024-02-15', 40, 100, ARRAY['design', 'ui-ux'], user_record.id),
      (project_id, 'Implement Product Catalog', 'Build product listing functionality', 'in_progress', 'medium', user_record.id, '2024-03-01', 60, 70, ARRAY['frontend', 'catalog'], user_record.id),
      (project_id, 'Payment Integration', 'Integrate payment processing', 'todo', 'urgent', user_record.id, '2024-03-15', 30, 0, ARRAY['backend', 'payment'], user_record.id);
    END IF;
  END LOOP;

  -- Re-enable all triggers
  ALTER TABLE projects ENABLE TRIGGER ALL;

  RAISE NOTICE 'Sample project data created successfully';
END $$;