-- Create minimal sample data that works with existing constraints
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  IF user_count > 0 THEN
    -- Create project templates first
    INSERT INTO project_templates (id, name, description, category, template_data, is_active) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'E-commerce Development', 'Complete e-commerce website with payment integration', 'web_development', 
     '{"phases": ["planning", "design", "development", "testing", "deployment"], "estimated_duration": 180}', true),
    ('550e8400-e29b-41d4-a716-446655440002', 'Mobile App Development', 'Native mobile application for iOS and Android', 'mobile_development',
     '{"phases": ["research", "design", "development", "testing", "launch"], "estimated_duration": 150}', true)
    ON CONFLICT (id) DO NOTHING;

    -- Use the simple function that already exists
    PERFORM create_sample_project_data();
    
    RAISE NOTICE 'Sample project data created successfully using existing function';
  ELSE
    RAISE NOTICE 'No users found, skipping sample data creation';
  END IF;
END $$;