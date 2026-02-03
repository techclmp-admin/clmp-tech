-- Create detailed tasks, budgets, and related data for sample projects
-- This creates logical connections between projects, tasks, budgets, materials, weather, etc.

DO $$
DECLARE
  current_user_id UUID;
  project_record RECORD;
  task_id UUID;
  
  -- Sample task arrays for different project types
  residential_tasks TEXT[] := ARRAY[
    'Site preparation and excavation',
    'Foundation pour and curing',
    'Framing and structural work',
    'Roofing installation',
    'Electrical rough-in',
    'Plumbing rough-in',
    'HVAC installation',
    'Insulation and drywall',
    'Flooring installation',
    'Kitchen and bathroom fixtures',
    'Interior painting',
    'Final inspections',
    'Landscaping and cleanup'
  ];
  
  commercial_tasks TEXT[] := ARRAY[
    'Site survey and permits',
    'Excavation and grading',
    'Foundation and basement',
    'Steel frame erection',
    'Concrete floors and walls',
    'Exterior envelope',
    'MEP rough-in',
    'Fire safety systems',
    'Elevator installation',
    'Interior fit-out',
    'HVAC commissioning',
    'Final testing and commissioning'
  ];
  
  industrial_tasks TEXT[] := ARRAY[
    'Environmental assessments',
    'Site preparation',
    'Heavy foundation work',
    'Steel structure assembly',
    'Specialized equipment installation',
    'Clean room construction',
    'Utility connections',
    'Safety systems installation',
    'Production line setup',
    'Testing and certification'
  ];
  
  infrastructure_tasks TEXT[] := ARRAY[
    'Environmental approval',
    'Traffic management setup',
    'Pier foundation construction',
    'Bridge deck installation',
    'Structural testing',
    'Safety barrier installation',
    'Road surface completion',
    'Final inspection'
  ];
  
  renovation_tasks TEXT[] := ARRAY[
    'Asbestos and hazmat removal',
    'Demolition phase 1',
    'Temporary utilities setup',
    'Structural modifications',
    'MEP system upgrades',
    'New construction areas',
    'Interior renovations',
    'Equipment installation',
    'Final cleanup and commissioning'
  ];
  
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found. Skipping task creation.';
    RETURN;
  END IF;
  
  -- Create tasks for each sample project
  FOR project_record IN (
    SELECT * FROM projects 
    WHERE name LIKE 'Sample:%' 
    ORDER BY created_at
  ) LOOP
    
    RAISE NOTICE 'Creating tasks for project: %', project_record.name;
    
    -- Create tasks based on project category
    IF project_record.category = 'residential' THEN
      FOR i IN 1..array_length(residential_tasks, 1) LOOP
        INSERT INTO project_tasks (
          project_id, title, description, status, priority,
          assigned_to, start_date, due_date, estimated_hours,
          created_by, task_order
        ) VALUES (
          project_record.id,
          residential_tasks[i],
          'Detailed work for ' || residential_tasks[i] || ' in ' || project_record.name,
          CASE 
            WHEN i <= (project_record.progress / 100.0) * array_length(residential_tasks, 1) THEN 'completed'
            WHEN i = CEIL((project_record.progress / 100.0) * array_length(residential_tasks, 1)) + 1 THEN 'in_progress'
            ELSE 'todo'
          END,
          CASE WHEN i % 3 = 0 THEN 'high' WHEN i % 3 = 1 THEN 'medium' ELSE 'low' END,
          current_user_id,
          project_record.start_date + (i * interval '1 week'),
          project_record.start_date + ((i + 2) * interval '1 week'),
          40 + (i * 8),
          current_user_id,
          i
        );
      END LOOP;
      
    ELSIF project_record.category = 'commercial' THEN
      FOR i IN 1..array_length(commercial_tasks, 1) LOOP
        INSERT INTO project_tasks (
          project_id, title, description, status, priority,
          assigned_to, start_date, due_date, estimated_hours,
          created_by, task_order
        ) VALUES (
          project_record.id,
          commercial_tasks[i],
          'Commercial construction task: ' || commercial_tasks[i],
          CASE 
            WHEN i <= (project_record.progress / 100.0) * array_length(commercial_tasks, 1) THEN 'completed'
            WHEN i = CEIL((project_record.progress / 100.0) * array_length(commercial_tasks, 1)) + 1 THEN 'in_progress'
            ELSE 'todo'
          END,
          'high',
          current_user_id,
          project_record.start_date + (i * interval '3 weeks'),
          project_record.start_date + ((i + 1) * interval '3 weeks'),
          120 + (i * 20),
          current_user_id,
          i
        );
      END LOOP;
      
    ELSIF project_record.category = 'industrial' THEN
      FOR i IN 1..array_length(industrial_tasks, 1) LOOP
        INSERT INTO project_tasks (
          project_id, title, description, status, priority,
          assigned_to, start_date, due_date, estimated_hours,
          created_by, task_order
        ) VALUES (
          project_record.id,
          industrial_tasks[i],
          'Industrial facility task: ' || industrial_tasks[i],
          CASE 
            WHEN i <= (project_record.progress / 100.0) * array_length(industrial_tasks, 1) THEN 'completed'
            WHEN i = CEIL((project_record.progress / 100.0) * array_length(industrial_tasks, 1)) + 1 THEN 'in_progress'
            ELSE 'todo'
          END,
          'urgent',
          current_user_id,
          project_record.start_date + (i * interval '2 weeks'),
          project_record.start_date + ((i + 3) * interval '2 weeks'),
          200 + (i * 40),
          current_user_id,
          i
        );
      END LOOP;
      
    ELSIF project_record.category = 'infrastructure' THEN
      FOR i IN 1..array_length(infrastructure_tasks, 1) LOOP
        INSERT INTO project_tasks (
          project_id, title, description, status, priority,
          assigned_to, start_date, due_date, estimated_hours,
          created_by, task_order
        ) VALUES (
          project_record.id,
          infrastructure_tasks[i],
          'Infrastructure project task: ' || infrastructure_tasks[i],
          CASE 
            WHEN i <= (project_record.progress / 100.0) * array_length(infrastructure_tasks, 1) THEN 'completed'
            WHEN i = CEIL((project_record.progress / 100.0) * array_length(infrastructure_tasks, 1)) + 1 THEN 'in_progress'
            ELSE 'todo'
          END,
          'high',
          current_user_id,
          project_record.start_date + (i * interval '1 month'),
          project_record.start_date + ((i + 1) * interval '1 month'),
          160 + (i * 30),
          current_user_id,
          i
        );
      END LOOP;
      
    ELSIF project_record.category = 'renovation' THEN
      FOR i IN 1..array_length(renovation_tasks, 1) LOOP
        INSERT INTO project_tasks (
          project_id, title, description, status, priority,
          assigned_to, start_date, due_date, estimated_hours,
          created_by, task_order
        ) VALUES (
          project_record.id,
          renovation_tasks[i],
          'Hospital renovation task: ' || renovation_tasks[i],
          CASE 
            WHEN i <= (project_record.progress / 100.0) * array_length(renovation_tasks, 1) THEN 'completed'
            WHEN i = CEIL((project_record.progress / 100.0) * array_length(renovation_tasks, 1)) + 1 THEN 'in_progress'
            ELSE 'todo'
          END,
          'urgent',
          current_user_id,
          project_record.start_date + (i * interval '3 weeks'),
          project_record.start_date + ((i + 2) * interval '3 weeks'),
          80 + (i * 15),
          current_user_id,
          i
        );
      END LOOP;
      
    ELSIF project_record.category = 'high-rise' THEN
      -- High-rise specific tasks
      FOR i IN 1..15 LOOP
        INSERT INTO project_tasks (
          project_id, title, description, status, priority,
          assigned_to, start_date, due_date, estimated_hours,
          created_by, task_order
        ) VALUES (
          project_record.id,
          'Floor ' || i || ' construction',
          'Complete construction of floor ' || i || ' including structure, MEP, and finishes',
          CASE 
            WHEN i <= (project_record.progress / 100.0) * 15 THEN 'completed'
            WHEN i = CEIL((project_record.progress / 100.0) * 15) + 1 THEN 'in_progress'
            ELSE 'todo'
          END,
          'high',
          current_user_id,
          project_record.start_date + (i * interval '2 months'),
          project_record.start_date + ((i + 1) * interval '2 months'),
          300 + (i * 20),
          current_user_id,
          i
        );
      END LOOP;
    END IF;
    
  END LOOP;
  
  RAISE NOTICE 'Sample project tasks created successfully with logical progression based on project progress.';
  
END $$;