-- Create comprehensive sample data for construction projects in Ontario
-- This includes projects, tasks, budgets, materials, weather, permits with logical connections

-- First, let's get the current authenticated user
DO $$
DECLARE
  current_user_id UUID;
  
  -- Project IDs for different construction types
  residential_project_id UUID := gen_random_uuid();
  commercial_project_id UUID := gen_random_uuid();
  industrial_project_id UUID := gen_random_uuid();
  infrastructure_project_id UUID := gen_random_uuid();
  renovation_project_id UUID := gen_random_uuid();
  highrise_project_id UUID := gen_random_uuid();
  
  -- Ontario cities
  toronto_city TEXT := 'Toronto, ON';
  ottawa_city TEXT := 'Ottawa, ON';
  hamilton_city TEXT := 'Hamilton, ON';
  london_city TEXT := 'London, ON';
  kitchener_city TEXT := 'Kitchener, ON';
  windsor_city TEXT := 'Windsor, ON';
  
BEGIN
  -- Get current user (or create sample user for demo)
  current_user_id := auth.uid();
  
  -- If no user, skip this operation
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'No authenticated user found. Sample data creation skipped.';
    RETURN;
  END IF;
  
  -- Clear existing sample data first
  DELETE FROM project_tasks WHERE project_id IN (
    SELECT id FROM projects WHERE name LIKE '%Sample%' OR name LIKE '%Demo%'
  );
  DELETE FROM project_members WHERE project_id IN (
    SELECT id FROM projects WHERE name LIKE '%Sample%' OR name LIKE '%Demo%'
  );
  DELETE FROM project_budgets WHERE project_id IN (
    SELECT id FROM projects WHERE name LIKE '%Sample%' OR name LIKE '%Demo%'
  );
  DELETE FROM projects WHERE name LIKE '%Sample%' OR name LIKE '%Demo%';
  
  -- 1. RESIDENTIAL PROJECTS
  -- Single Family Home in Toronto
  INSERT INTO projects (
    id, name, description, status, category, location, 
    start_date, end_date, budget, progress, priority,
    created_by, project_manager_id, current_phase,
    tags, metadata
  ) VALUES (
    residential_project_id,
    'Sample: Luxury Single-Family Home - Toronto',
    'Construction of a 3500 sq ft luxury single-family home with modern amenities, energy-efficient systems, and smart home integration in North York, Toronto.',
    'active',
    'residential',
    toronto_city,
    '2024-03-01',
    '2024-11-30',
    850000.00,
    45,
    'high',
    current_user_id,
    current_user_id,
    'construction',
    ARRAY['luxury', 'single-family', 'smart-home', 'energy-efficient'],
    jsonb_build_object(
      'square_footage', 3500,
      'bedrooms', 4,
      'bathrooms', 3.5,
      'garage', 2,
      'lot_size', 0.25,
      'foundation_type', 'full_basement',
      'exterior_material', 'brick_stone',
      'hvac_type', 'forced_air_heat_pump'
    )
  );
  
  -- Townhouse Development in Ottawa
  INSERT INTO projects (
    id, name, description, status, category, location,
    start_date, end_date, budget, progress, priority,
    created_by, project_manager_id, current_phase,
    tags, metadata
  ) VALUES (
    gen_random_uuid(),
    'Sample: Executive Townhouse Development - Ottawa',
    'Development of 24-unit executive townhouse complex with shared amenities and underground parking in Kanata, Ottawa.',
    'active',
    'residential',
    ottawa_city,
    '2024-01-15',
    '2025-08-31',
    12500000.00,
    25,
    'high',
    current_user_id,
    current_user_id,
    'foundation',
    ARRAY['townhouse', 'development', 'executive', 'underground-parking'],
    jsonb_build_object(
      'units', 24,
      'unit_size_range', '1800-2200 sq ft',
      'parking_spots', 48,
      'amenities', ARRAY['community_center', 'playground', 'walking_trails'],
      'construction_type', 'wood_frame',
      'energy_rating', 'Energy Star'
    )
  );
  
  -- 2. COMMERCIAL PROJECTS
  -- Office Complex in Hamilton
  INSERT INTO projects (
    id, name, description, status, category, location,
    start_date, end_date, budget, progress, priority,
    created_by, project_manager_id, current_phase,
    tags, metadata
  ) VALUES (
    commercial_project_id,
    'Sample: Modern Office Complex - Hamilton',
    'Construction of a 6-story, 150,000 sq ft Class A office building with retail space on ground floor in downtown Hamilton.',
    'active',
    'commercial',
    hamilton_city,
    '2024-02-01',
    '2025-12-31',
    45000000.00,
    35,
    'urgent',
    current_user_id,
    current_user_id,
    'structure',
    ARRAY['office', 'class-a', 'retail', 'downtown', 'mixed-use'],
    jsonb_build_object(
      'floors', 6,
      'total_sqft', 150000,
      'office_sqft', 120000,
      'retail_sqft', 30000,
      'parking_spaces', 300,
      'leed_certification', 'Gold',
      'construction_type', 'steel_concrete'
    )
  );
  
  -- Shopping Center in London
  INSERT INTO projects (
    id, name, description, status, category, location,
    start_date, end_date, budget, progress, priority,
    created_by, project_manager_id, current_phase,
    tags, metadata
  ) VALUES (
    gen_random_uuid(),
    'Sample: Community Shopping Center - London',
    'Development of 80,000 sq ft community shopping center with anchor grocery store and 15 retail units in West London.',
    'planning',
    'commercial',
    london_city,
    '2024-05-01',
    '2025-10-31',
    28000000.00,
    15,
    'medium',
    current_user_id,
    current_user_id,
    'design',
    ARRAY['shopping-center', 'retail', 'grocery', 'community'],
    jsonb_build_object(
      'total_sqft', 80000,
      'anchor_store_sqft', 35000,
      'retail_units', 15,
      'parking_spaces', 250,
      'food_court', true,
      'loading_docks', 4
    )
  );
  
  -- 3. INDUSTRIAL PROJECTS
  -- Manufacturing Facility in Kitchener
  INSERT INTO projects (
    id, name, description, status, category, location,
    start_date, end_date, budget, progress, priority,
    created_by, project_manager_id, current_phase,
    tags, metadata
  ) VALUES (
    industrial_project_id,
    'Sample: Automotive Parts Manufacturing - Kitchener',
    'Construction of 200,000 sq ft automotive parts manufacturing facility with clean rooms and automated production lines.',
    'active',
    'industrial',
    kitchener_city,
    '2024-01-01',
    '2025-06-30',
    75000000.00,
    55,
    'urgent',
    current_user_id,
    current_user_id,
    'construction',
    ARRAY['manufacturing', 'automotive', 'clean-room', 'automated'],
    jsonb_build_object(
      'total_sqft', 200000,
      'production_sqft', 150000,
      'office_sqft', 25000,
      'warehouse_sqft', 25000,
      'clean_rooms', 3,
      'production_lines', 8,
      'power_requirement_kw', 5000
    )
  );
  
  -- 4. INFRASTRUCTURE PROJECTS
  -- Bridge Construction in Windsor
  INSERT INTO projects (
    id, name, description, status, category, location,
    start_date, end_date, budget, progress, priority,
    created_by, project_manager_id, current_phase,
    tags, metadata
  ) VALUES (
    infrastructure_project_id,
    'Sample: Highway Overpass Bridge - Windsor',
    'Construction of 4-lane highway overpass bridge with pedestrian walkway over Highway 401 near Windsor Airport.',
    'active',
    'infrastructure',
    windsor_city,
    '2024-04-01',
    '2025-11-30',
    18500000.00,
    30,
    'high',
    current_user_id,
    current_user_id,
    'foundation',
    ARRAY['bridge', 'highway', 'overpass', 'pedestrian'],
    jsonb_build_object(
      'span_length_m', 85,
      'lanes', 4,
      'pedestrian_walkway', true,
      'bridge_type', 'concrete_girder',
      'load_capacity_tons', 80,
      'environmental_clearances', ARRAY['MTO', 'Conservation Authority']
    )
  );
  
  -- 5. RENOVATION PROJECT
  -- Hospital Renovation in Toronto
  INSERT INTO projects (
    id, name, description, status, category, location,
    start_date, end_date, budget, progress, priority,
    created_by, project_manager_id, current_phase,
    tags, metadata
  ) VALUES (
    renovation_project_id,
    'Sample: Hospital Emergency Wing Renovation - Toronto',
    'Complete renovation and expansion of emergency department at Toronto General Hospital, including new imaging suite and trauma bays.',
    'active',
    'renovation',
    toronto_city,
    '2024-06-01',
    '2025-03-31',
    15500000.00,
    20,
    'urgent',
    current_user_id,
    current_user_id,
    'demolition',
    ARRAY['hospital', 'emergency', 'healthcare', 'renovation'],
    jsonb_build_object(
      'existing_sqft', 25000,
      'new_sqft', 8000,
      'trauma_bays', 12,
      'imaging_rooms', 4,
      'operating_24_7', true,
      'infection_control_level', 'high'
    )
  );
  
  -- 6. HIGH-RISE PROJECT
  -- Condo Tower in Toronto
  INSERT INTO projects (
    id, name, description, status, category, location,
    start_date, end_date, budget, progress, priority,
    created_by, project_manager_id, current_phase,
    tags, metadata
  ) VALUES (
    highrise_project_id,
    'Sample: Luxury Condo Tower - Toronto',
    '42-story luxury condominium tower with 380 units, retail podium, and amenity floors in Toronto\'s Entertainment District.',
    'active',
    'high-rise',
    toronto_city,
    '2023-09-01',
    '2026-05-31',
    185000000.00,
    65,
    'high',
    current_user_id,
    current_user_id,
    'superstructure',
    ARRAY['condo', 'luxury', 'high-rise', 'entertainment-district'],
    jsonb_build_object(
      'floors', 42,
      'units', 380,
      'unit_types', ARRAY['studio', '1BR', '2BR', '3BR', 'penthouse'],
      'amenity_floors', 3,
      'retail_sqft', 15000,
      'parking_levels', 3,
      'parking_spaces', 420
    )
  );
  
  -- Add project members for all projects
  INSERT INTO project_members (project_id, user_id, role, joined_at)
  SELECT id, current_user_id, 'admin', now()
  FROM projects 
  WHERE name LIKE 'Sample:%';
  
  RAISE NOTICE 'Sample construction projects created successfully with logical data connections.';
  
END $$;