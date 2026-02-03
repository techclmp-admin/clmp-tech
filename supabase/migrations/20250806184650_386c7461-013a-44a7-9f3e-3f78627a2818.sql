-- Create comprehensive sample project data for all users
DO $$
DECLARE
  project_id UUID;
  user_record RECORD;
BEGIN
  -- Create project templates first
  INSERT INTO project_templates (id, name, description, category, template_data, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'E-commerce Development', 'Complete e-commerce website with payment integration', 'web_development', 
   '{"phases": ["planning", "design", "development", "testing", "deployment"], "estimated_duration": 180, "default_tasks": ["User authentication", "Product catalog", "Shopping cart", "Payment gateway", "Admin dashboard"]}', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Mobile App Development', 'Native mobile application for iOS and Android', 'mobile_development',
   '{"phases": ["research", "design", "development", "testing", "launch"], "estimated_duration": 150, "default_tasks": ["UI/UX Design", "Backend API", "Mobile app development", "Testing", "App store submission"]}', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Construction Project', 'Residential or commercial construction project management', 'construction',
   '{"phases": ["planning", "design", "construction", "finishing", "handover"], "estimated_duration": 365, "default_tasks": ["Site preparation", "Foundation", "Structure", "MEP systems", "Interior finishing"]}', true)
  ON CONFLICT (id) DO NOTHING;

  -- Loop through all existing users and create sample projects for each
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Create sample projects for each user
    INSERT INTO projects (id, name, description, status, priority, start_date, end_date, budget, progress, current_phase, created_by, project_manager_id) VALUES
    (gen_random_uuid(), 'E-commerce Website Redesign', 'Complete redesign of company e-commerce platform with modern UI/UX and mobile optimization', 'active', 'high', '2024-01-15', '2024-06-30', 75000, 65, 'development', user_record.id, user_record.id),
    (gen_random_uuid(), 'Mobile App Development', 'Native iOS and Android app for customer service and order tracking', 'active', 'urgent', '2024-02-01', '2024-08-15', 120000, 35, 'design', user_record.id, user_record.id),
    (gen_random_uuid(), 'Data Analytics Dashboard', 'Business intelligence dashboard for real-time analytics and reporting', 'active', 'medium', '2024-03-01', '2024-09-30', 45000, 80, 'testing', user_record.id, user_record.id),
    (gen_random_uuid(), 'AI Chatbot Integration', 'Implement AI-powered customer support chatbot with natural language processing', 'completed', 'low', '2023-11-01', '2024-01-31', 30000, 100, 'completed', user_record.id, user_record.id),
    (gen_random_uuid(), 'Cloud Infrastructure Migration', 'Migrate existing systems to AWS cloud infrastructure with improved security and scalability', 'on_hold', 'high', '2024-04-01', '2024-12-31', 95000, 25, 'planning', user_record.id, user_record.id);

    -- Get project IDs for adding members and tasks
    FOR project_id IN SELECT id FROM projects WHERE created_by = user_record.id AND name IN ('E-commerce Website Redesign', 'Mobile App Development', 'Data Analytics Dashboard', 'AI Chatbot Integration', 'Cloud Infrastructure Migration') LOOP
      -- Add project members
      INSERT INTO project_members (project_id, user_id, role, joined_at) VALUES
      (project_id, user_record.id, 'admin', now())
      ON CONFLICT (project_id, user_id) DO NOTHING;

      -- Create sample tasks based on project
      CASE 
        WHEN (SELECT name FROM projects WHERE id = project_id) = 'E-commerce Website Redesign' THEN
          INSERT INTO project_tasks (project_id, title, description, status, priority, assigned_to, due_date, estimated_hours, completion_percentage, tags, created_by) VALUES
          (project_id, 'Design Homepage Mockups', 'Create responsive homepage designs for desktop and mobile', 'completed', 'high', user_record.id, '2024-02-15', 40, 100, ARRAY['design', 'ui-ux', 'homepage'], user_record.id),
          (project_id, 'Implement Product Catalog', 'Build product listing and filtering functionality', 'in_progress', 'medium', user_record.id, '2024-03-01', 60, 70, ARRAY['frontend', 'catalog', 'react'], user_record.id),
          (project_id, 'Payment Gateway Integration', 'Integrate Stripe payment processing', 'todo', 'urgent', user_record.id, '2024-03-15', 30, 0, ARRAY['backend', 'payment', 'stripe'], user_record.id);
        
        WHEN (SELECT name FROM projects WHERE id = project_id) = 'Mobile App Development' THEN
          INSERT INTO project_tasks (project_id, title, description, status, priority, assigned_to, due_date, estimated_hours, completion_percentage, tags, created_by) VALUES
          (project_id, 'User Authentication Setup', 'Implement login/register functionality with OAuth', 'completed', 'high', user_record.id, '2024-02-20', 35, 100, ARRAY['mobile', 'auth', 'oauth'], user_record.id),
          (project_id, 'Order Tracking UI', 'Build order status tracking interface', 'in_progress', 'urgent', user_record.id, '2024-03-10', 45, 60, ARRAY['mobile', 'ui', 'tracking'], user_record.id),
          (project_id, 'Push Notifications', 'Implement push notification system', 'todo', 'medium', user_record.id, '2024-03-25', 25, 0, ARRAY['mobile', 'notifications'], user_record.id);
        
        WHEN (SELECT name FROM projects WHERE id = project_id) = 'Data Analytics Dashboard' THEN
          INSERT INTO project_tasks (project_id, title, description, status, priority, assigned_to, due_date, estimated_hours, completion_percentage, tags, created_by) VALUES
          (project_id, 'Database Setup', 'Configure data warehouse and ETL processes', 'completed', 'high', user_record.id, '2024-03-15', 50, 100, ARRAY['database', 'etl', 'warehouse'], user_record.id),
          (project_id, 'Dashboard Frontend', 'Build interactive dashboard with charts and filters', 'in_progress', 'high', user_record.id, '2024-04-01', 80, 75, ARRAY['frontend', 'charts', 'dashboard'], user_record.id),
          (project_id, 'API Development', 'Create REST API for data access', 'completed', 'medium', user_record.id, '2024-03-20', 40, 100, ARRAY['api', 'backend', 'rest'], user_record.id);
        
        ELSE
          NULL; -- Skip other projects for now
      END CASE;

      -- Create sample project files
      INSERT INTO project_files (project_id, file_name, file_path, file_size, file_type, uploaded_by, folder_path) VALUES
      (project_id, 'Project Requirements.pdf', '/documents/requirements.pdf', 2048576, 'application/pdf', user_record.id, '/documents'),
      (project_id, 'Design Mockups.figma', '/designs/mockups.figma', 15728640, 'application/figma', user_record.id, '/designs'),
      (project_id, 'Technical Specification.docx', '/documents/tech-spec.docx', 1048576, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', user_record.id, '/documents')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Sample project data created successfully for all users';
END $$;