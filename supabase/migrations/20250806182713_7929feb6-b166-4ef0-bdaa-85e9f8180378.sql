-- Create comprehensive sample data for system testing (final corrected version)

-- First, let's create diverse project templates (using NULL for foreign keys)
INSERT INTO public.project_templates (
  id, name, description, template_data, category, is_system_template, created_by
) VALUES 
(
  '11111111-2222-3333-4444-555555555555',
  'Residential Construction',
  'Complete template for residential home construction projects including foundation, framing, electrical, plumbing, and finishing work',
  '{
    "budget": 750000.00,
    "duration_days": 180,
    "task_templates": [
      {"title": "Site Preparation", "description": "Clear and prepare construction site", "estimated_hours": 40, "priority": "high", "phase": "preparation"},
      {"title": "Foundation Work", "description": "Pour concrete foundation and basement", "estimated_hours": 120, "priority": "urgent", "phase": "foundation"},
      {"title": "Framing", "description": "Complete structural framing", "estimated_hours": 200, "priority": "high", "phase": "structure"},
      {"title": "Electrical Rough-in", "description": "Install electrical wiring and outlets", "estimated_hours": 80, "priority": "medium", "phase": "systems"},
      {"title": "Plumbing Rough-in", "description": "Install plumbing pipes and fixtures", "estimated_hours": 60, "priority": "medium", "phase": "systems"},
      {"title": "Insulation", "description": "Install thermal insulation", "estimated_hours": 40, "priority": "medium", "phase": "finishing"},
      {"title": "Drywall Installation", "description": "Install and finish drywall", "estimated_hours": 100, "priority": "medium", "phase": "finishing"},
      {"title": "Flooring", "description": "Install hardwood and tile flooring", "estimated_hours": 80, "priority": "medium", "phase": "finishing"},
      {"title": "Final Inspection", "description": "Complete final building inspection", "estimated_hours": 8, "priority": "urgent", "phase": "completion"}
    ],
    "milestone_templates": [
      {"title": "Foundation Complete", "target_date_offset": 30, "description": "Foundation and basement work completed"},
      {"title": "Structure Complete", "target_date_offset": 90, "description": "Framing and structural work completed"},
      {"title": "Systems Complete", "target_date_offset": 120, "description": "Electrical and plumbing rough-in completed"},
      {"title": "Move-in Ready", "target_date_offset": 180, "description": "Construction complete and ready for occupancy"}
    ]
  }'::jsonb,
  'construction',
  true,
  NULL
),
(
  '22222222-3333-4444-5555-666666666666',
  'Commercial Renovation',
  'Template for commercial space renovation including permits, demolition, reconstruction, and compliance',
  '{
    "budget": 450000.00,
    "duration_days": 120,
    "task_templates": [
      {"title": "Permit Acquisition", "description": "Obtain all necessary construction permits", "estimated_hours": 16, "priority": "urgent", "phase": "planning"},
      {"title": "Demolition", "description": "Selective demolition of existing structures", "estimated_hours": 60, "priority": "high", "phase": "demolition"},
      {"title": "Structural Modifications", "description": "Make necessary structural changes", "estimated_hours": 100, "priority": "high", "phase": "structure"},
      {"title": "HVAC Installation", "description": "Install new heating and cooling systems", "estimated_hours": 80, "priority": "medium", "phase": "systems"},
      {"title": "Fire Safety Systems", "description": "Install sprinklers and fire detection", "estimated_hours": 40, "priority": "high", "phase": "safety"},
      {"title": "Accessibility Compliance", "description": "Ensure ADA compliance modifications", "estimated_hours": 30, "priority": "high", "phase": "compliance"},
      {"title": "Interior Finishing", "description": "Complete interior finishes and fixtures", "estimated_hours": 120, "priority": "medium", "phase": "finishing"}
    ],
    "milestone_templates": [
      {"title": "Permits Approved", "target_date_offset": 14, "description": "All construction permits obtained"},
      {"title": "Demolition Complete", "target_date_offset": 30, "description": "Demolition work completed safely"},
      {"title": "Structure Ready", "target_date_offset": 60, "description": "Structural modifications completed"},
      {"title": "Systems Operational", "target_date_offset": 90, "description": "All building systems installed and tested"},
      {"title": "Ready for Occupancy", "target_date_offset": 120, "description": "Renovation complete and inspected"}
    ]
  }'::jsonb,
  'renovation',
  true,
  NULL
),
(
  '33333333-4444-5555-6666-777777777777',
  'Infrastructure Development',
  'Large-scale infrastructure project template for roads, utilities, and public works',
  '{
    "budget": 2500000.00,
    "duration_days": 365,
    "task_templates": [
      {"title": "Environmental Assessment", "description": "Complete environmental impact study", "estimated_hours": 200, "priority": "urgent", "phase": "planning"},
      {"title": "Survey and Design", "description": "Conduct land survey and engineering design", "estimated_hours": 300, "priority": "high", "phase": "design"},
      {"title": "Utility Relocation", "description": "Relocate existing utilities as needed", "estimated_hours": 150, "priority": "high", "phase": "preparation"},
      {"title": "Excavation", "description": "Major earthwork and excavation", "estimated_hours": 400, "priority": "medium", "phase": "construction"},
      {"title": "Concrete Work", "description": "Pour concrete for roads and structures", "estimated_hours": 300, "priority": "medium", "phase": "construction"},
      {"title": "Asphalt Paving", "description": "Complete road surface paving", "estimated_hours": 200, "priority": "medium", "phase": "paving"},
      {"title": "Landscaping", "description": "Restore landscaping and green spaces", "estimated_hours": 100, "priority": "low", "phase": "finishing"}
    ],
    "milestone_templates": [
      {"title": "Environmental Clearance", "target_date_offset": 60, "description": "Environmental assessment approved"},
      {"title": "Design Approval", "target_date_offset": 120, "description": "Engineering designs approved"},
      {"title": "Construction Start", "target_date_offset": 180, "description": "Major construction phase begins"},
      {"title": "Paving Complete", "target_date_offset": 300, "description": "Road paving completed"},
      {"title": "Project Complete", "target_date_offset": 365, "description": "Infrastructure project fully completed"}
    ]
  }'::jsonb,
  'infrastructure',
  true,
  NULL
);

-- Create diverse sample projects with various statuses and complexity  
INSERT INTO public.projects (
  id, name, description, status, priority, start_date, end_date, budget, progress,
  created_by, project_manager_id, current_phase, metadata
) VALUES 
(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'Downtown Office Tower Construction',
  'Construction of a 25-story mixed-use office tower in downtown Toronto featuring modern amenities, LEED certification, and underground parking',
  'active',
  'urgent',
  '2024-03-01',
  '2025-08-15',
  15000000.00,
  35,
  auth.uid(),
  auth.uid(),
  'structure',
  '{"client_name": "Metropolitan Developments", "contact_person": "Sarah Mitchell", "phone": "+1-416-555-0123", "email": "s.mitchell@metrodev.ca", "location": "Toronto, ON", "project_type": "construction"}'::jsonb
),
(
  'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
  'Heritage Building Restoration',
  'Complete restoration of a 1920s heritage building in Montreal, preserving historical features while adding modern safety and accessibility features',
  'active',
  'high',
  '2024-01-15',
  '2024-12-20',
  3500000.00,
  65,
  auth.uid(),
  auth.uid(),
  'restoration',
  '{"client_name": "Heritage Preservation Society", "contact_person": "Jean-Claude Dubois", "phone": "+1-514-555-0456", "email": "jc.dubois@heritage.qc.ca", "location": "Montreal, QC", "project_type": "renovation"}'::jsonb
),
(
  'cccccccc-dddd-eeee-ffff-gggggggggggg',
  'Highway 401 Expansion Project',
  'Major highway expansion project including additional lanes, improved interchanges, and smart traffic management systems',
  'active',
  'urgent',
  '2024-04-01',
  '2026-03-31',
  85000000.00,
  15,
  auth.uid(),
  auth.uid(),
  'preparation',
  '{"client_name": "Ministry of Transportation Ontario", "contact_person": "Michael Roberts", "phone": "+1-416-555-0789", "email": "m.roberts@ontario.ca", "location": "Ontario, Canada", "project_type": "infrastructure"}'::jsonb
),
(
  'dddddddd-eeee-ffff-aaaa-hhhhhhhhhhhh',
  'Luxury Residential Complex',
  'Development of a high-end residential complex with 150 units, including townhomes and condominiums with premium amenities',
  'planning',
  'medium',
  '2024-09-01',
  '2026-06-30',
  45000000.00,
  5,
  auth.uid(),
  auth.uid(),
  'design',
  '{"client_name": "Pacific Coast Properties", "contact_person": "Lisa Wang", "phone": "+1-604-555-0321", "email": "l.wang@pacificcoast.ca", "location": "Vancouver, BC", "project_type": "construction"}'::jsonb
),
(
  'eeeeeeee-ffff-aaaa-bbbb-iiiiiiiiiiii',
  'Hospital Emergency Wing Addition',
  'Construction of a new emergency wing for Vancouver General Hospital including trauma bays, surgical suites, and helicopter landing pad',
  'completed',
  'urgent',
  '2023-01-10',
  '2024-02-28',
  28000000.00,
  100,
  auth.uid(),
  auth.uid(),
  'completion',
  '{"client_name": "Vancouver Coastal Health", "contact_person": "Dr. Amanda Chen", "phone": "+1-604-555-0654", "email": "a.chen@vch.ca", "location": "Vancouver, BC", "project_type": "construction"}'::jsonb
),
(
  'ffffffff-aaaa-bbbb-cccc-jjjjjjjjjjjj',
  'Shopping Mall Modernization',
  'Complete modernization of Yorkdale Shopping Centre including new storefronts, improved lighting, and enhanced customer amenities',
  'on_hold',
  'low',
  '2024-06-01',
  '2025-03-15',
  8500000.00,
  25,
  auth.uid(),
  auth.uid(),
  'design',
  '{"client_name": "Oxford Properties", "contact_person": "Robert Thompson", "phone": "+1-416-555-0987", "email": "r.thompson@oxfordproperties.com", "location": "Toronto, ON", "project_type": "renovation"}'::jsonb
);

-- Add project members with various roles
INSERT INTO public.project_members (project_id, user_id, role, permissions, joined_at) VALUES 
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', auth.uid(), 'admin', '["all"]'::jsonb, '2024-03-01'),
('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', auth.uid(), 'admin', '["all"]'::jsonb, '2024-01-15'),
('cccccccc-dddd-eeee-ffff-gggggggggggg', auth.uid(), 'admin', '["all"]'::jsonb, '2024-04-01'),
('dddddddd-eeee-ffff-aaaa-hhhhhhhhhhhh', auth.uid(), 'admin', '["all"]'::jsonb, '2024-09-01'),
('eeeeeeee-ffff-aaaa-bbbb-iiiiiiiiiiii', auth.uid(), 'admin', '["all"]'::jsonb, '2023-01-10'),
('ffffffff-aaaa-bbbb-cccc-jjjjjjjjjjjj', auth.uid(), 'admin', '["all"]'::jsonb, '2024-06-01');

-- Create comprehensive project tasks with various statuses and priorities
INSERT INTO public.project_tasks (
  project_id, title, description, status, priority, assigned_to, due_date, 
  estimated_hours, completion_percentage, tags, created_by, dependencies, phase
) VALUES 
-- Downtown Office Tower Construction Tasks
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Site Survey and Soil Testing', 'Conduct comprehensive geotechnical analysis and topographical survey of construction site', 'completed', 'urgent', auth.uid(), '2024-03-15', 80, 100, ARRAY['survey', 'geotechnical', 'site-prep'], auth.uid(), '[]'::jsonb, 'planning'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Foundation Excavation', 'Excavate foundation to required depth and prepare for concrete pour', 'completed', 'high', auth.uid(), '2024-04-30', 120, 100, ARRAY['excavation', 'foundation', 'heavy-machinery'], auth.uid(), '[]'::jsonb, 'foundation'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Concrete Foundation Pour', 'Pour concrete foundation and basement walls according to engineering specifications', 'completed', 'urgent', auth.uid(), '2024-05-15', 200, 100, ARRAY['concrete', 'foundation', 'structural'], auth.uid(), '[]'::jsonb, 'foundation'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Steel Frame Installation', 'Install structural steel framework for floors 1-10', 'in_progress', 'urgent', auth.uid(), '2024-08-30', 400, 60, ARRAY['steel', 'structural', 'crane-work'], auth.uid(), '[]'::jsonb, 'structure'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Elevator Shaft Construction', 'Build elevator shafts and install guide rails', 'in_progress', 'high', auth.uid(), '2024-09-15', 150, 40, ARRAY['elevator', 'vertical-transport', 'precision'], auth.uid(), '[]'::jsonb, 'structure'),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Electrical Rough-in Phase 1', 'Install electrical conduits and wiring for floors 1-5', 'todo', 'medium', auth.uid(), '2024-10-31', 200, 0, ARRAY['electrical', 'rough-in', 'conduit'], auth.uid(), '[]'::jsonb, 'systems'),

-- Heritage Building Restoration Tasks
('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'Historical Documentation', 'Document existing architectural features and create preservation plan', 'completed', 'urgent', auth.uid(), '2024-02-15', 60, 100, ARRAY['documentation', 'heritage', 'preservation'], auth.uid(), '[]'::jsonb, 'planning'),
('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'Structural Assessment', 'Evaluate structural integrity and identify required reinforcements', 'completed', 'urgent', auth.uid(), '2024-03-01', 40, 100, ARRAY['structural', 'assessment', 'engineering'], auth.uid(), '[]'::jsonb, 'assessment'),
('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'Facade Restoration', 'Restore original brick facade and heritage window frames', 'in_progress', 'high', auth.uid(), '2024-09-30', 300, 75, ARRAY['facade', 'masonry', 'windows'], auth.uid(), '[]'::jsonb, 'restoration'),
('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'Interior Restoration', 'Restore hardwood floors, crown molding, and decorative plasterwork', 'in_progress', 'medium', auth.uid(), '2024-11-15', 250, 50, ARRAY['interior', 'woodwork', 'plaster'], auth.uid(), '[]'::jsonb, 'restoration'),
('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'Modern Systems Integration', 'Install modern HVAC, electrical, and plumbing while preserving heritage features', 'todo', 'high', auth.uid(), '2024-12-01', 180, 0, ARRAY['hvac', 'electrical', 'plumbing', 'integration'], auth.uid(), '[]'::jsonb, 'systems'),

-- Highway 401 Expansion Tasks
('cccccccc-dddd-eeee-ffff-gggggggggggg', 'Environmental Impact Study', 'Complete comprehensive environmental assessment and mitigation plan', 'completed', 'urgent', auth.uid(), '2024-06-30', 400, 100, ARRAY['environmental', 'assessment', 'mitigation'], auth.uid(), '[]'::jsonb, 'planning'),
('cccccccc-dddd-eeee-ffff-gggggggggggg', 'Traffic Management Plan', 'Develop comprehensive traffic diversion and safety plan during construction', 'completed', 'urgent', auth.uid(), '2024-07-15', 120, 100, ARRAY['traffic', 'safety', 'planning'], auth.uid(), '[]'::jsonb, 'planning'),
('cccccccc-dddd-eeee-ffff-gggggggggggg', 'Utility Relocation Phase 1', 'Relocate gas lines, water mains, and telecommunications infrastructure', 'in_progress', 'high', auth.uid(), '2024-12-31', 300, 25, ARRAY['utilities', 'relocation', 'infrastructure'], auth.uid(), '[]'::jsonb, 'preparation'),
('cccccccc-dddd-eeee-ffff-gggggggggggg', 'Bridge Reconstruction', 'Rebuild overpass bridges to accommodate additional lanes', 'todo', 'urgent', auth.uid(), '2025-06-30', 800, 0, ARRAY['bridge', 'reconstruction', 'concrete'], auth.uid(), '[]'::jsonb, 'construction'),
('cccccccc-dddd-eeee-ffff-gggggggggggg', 'Smart Traffic System Installation', 'Install intelligent traffic management and monitoring systems', 'todo', 'medium', auth.uid(), '2025-12-31', 200, 0, ARRAY['smart-systems', 'technology', 'monitoring'], auth.uid(), '[]'::jsonb, 'technology'),

-- Luxury Residential Complex Tasks
('dddddddd-eeee-ffff-aaaa-hhhhhhhhhhhh', 'Master Planning and Design', 'Develop comprehensive site plan and architectural designs for residential complex', 'in_progress', 'high', auth.uid(), '2024-10-31', 200, 30, ARRAY['planning', 'design', 'architecture'], auth.uid(), '[]'::jsonb, 'design'),
('dddddddd-eeee-ffff-aaaa-hhhhhhhhhhhh', 'Zoning and Permit Applications', 'Submit and obtain all required zoning variances and construction permits', 'todo', 'urgent', auth.uid(), '2024-11-30', 80, 0, ARRAY['permits', 'zoning', 'approvals'], auth.uid(), '[]'::jsonb, 'permits'),
('dddddddd-eeee-ffff-aaaa-hhhhhhhhhhhh', 'Site Preparation', 'Clear site, install temporary utilities, and prepare for construction', 'todo', 'medium', auth.uid(), '2025-01-31', 120, 0, ARRAY['site-prep', 'clearing', 'utilities'], auth.uid(), '[]'::jsonb, 'preparation'),

-- Hospital Emergency Wing Tasks (Completed Project)
('eeeeeeee-ffff-aaaa-bbbb-iiiiiiiiiiii', 'Medical Equipment Specification', 'Specify and procure specialized emergency medical equipment', 'completed', 'urgent', auth.uid(), '2023-06-30', 100, 100, ARRAY['medical-equipment', 'procurement', 'specifications'], auth.uid(), '[]'::jsonb, 'planning'),
('eeeeeeee-ffff-aaaa-bbbb-iiiiiiiiiiii', 'Sterile Environment Construction', 'Build operating rooms and trauma bays to hospital standards', 'completed', 'urgent', auth.uid(), '2023-12-15', 400, 100, ARRAY['sterile', 'medical', 'construction'], auth.uid(), '[]'::jsonb, 'construction'),
('eeeeeeee-ffff-aaaa-bbbb-iiiiiiiiiiii', 'Helicopter Landing Pad', 'Construct rooftop helicopter landing pad with navigation equipment', 'completed', 'high', auth.uid(), '2024-01-31', 200, 100, ARRAY['helipad', 'rooftop', 'navigation'], auth.uid(), '[]'::jsonb, 'construction'),
('eeeeeeee-ffff-aaaa-bbbb-iiiiiiiiiiii', 'Final Medical Certification', 'Complete all medical facility certifications and inspections', 'completed', 'urgent', auth.uid(), '2024-02-28', 40, 100, ARRAY['certification', 'inspection', 'compliance'], auth.uid(), '[]'::jsonb, 'completion'),

-- Shopping Mall Modernization Tasks (On Hold)
('ffffffff-aaaa-bbbb-cccc-jjjjjjjjjjjj', 'Tenant Coordination', 'Coordinate with existing tenants for construction timeline and access', 'in_progress', 'high', auth.uid(), '2024-08-31', 60, 40, ARRAY['tenant-relations', 'coordination', 'scheduling'], auth.uid(), '[]'::jsonb, 'planning'),
('ffffffff-aaaa-bbbb-cccc-jjjjjjjjjjjj', 'Storefront Renovation Design', 'Design modern storefront layouts and lighting schemes', 'in_progress', 'medium', auth.uid(), '2024-09-30', 80, 60, ARRAY['design', 'storefront', 'lighting'], auth.uid(), '[]'::jsonb, 'design'),
('ffffffff-aaaa-bbbb-cccc-jjjjjjjjjjjj', 'HVAC System Upgrade', 'Upgrade mall-wide heating, ventilation, and air conditioning systems', 'todo', 'medium', auth.uid(), '2025-01-31', 300, 0, ARRAY['hvac', 'upgrade', 'climate-control'], auth.uid(), '[]'::jsonb, 'systems');

-- Create sample project files
INSERT INTO public.project_files (
  project_id, file_name, file_path, file_type, file_size, uploaded_by, folder_path, version
) VALUES 
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Architectural_Plans_v3.pdf', '/projects/downtown-office/docs/Architectural_Plans_v3.pdf', 'application/pdf', 15728640, auth.uid(), '/projects/downtown-office/docs/', 3),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Structural_Engineering_Report.pdf', '/projects/downtown-office/engineering/Structural_Engineering_Report.pdf', 'application/pdf', 8912345, auth.uid(), '/projects/downtown-office/engineering/', 1),
('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'Heritage_Documentation.pdf', '/projects/heritage-restoration/docs/Heritage_Documentation.pdf', 'application/pdf', 12456789, auth.uid(), '/projects/heritage-restoration/docs/', 2),
('cccccccc-dddd-eeee-ffff-gggggggggggg', 'Environmental_Impact_Assessment.pdf', '/projects/highway-expansion/environmental/Environmental_Impact_Assessment.pdf', 'application/pdf', 23456789, auth.uid(), '/projects/highway-expansion/environmental/', 1),
('dddddddd-eeee-ffff-aaaa-hhhhhhhhhhhh', 'Site_Master_Plan.pdf', '/projects/luxury-residential/planning/Site_Master_Plan.pdf', 'application/pdf', 18765432, auth.uid(), '/projects/luxury-residential/planning/', 1),
('eeeeeeee-ffff-aaaa-bbbb-iiiiiiiiiiii', 'Medical_Equipment_List.xlsx', '/projects/hospital-wing/equipment/Medical_Equipment_List.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 3456789, auth.uid(), '/projects/hospital-wing/equipment/', 1),
('ffffffff-aaaa-bbbb-cccc-jjjjjjjjjjjj', 'Tenant_Agreement_Template.docx', '/projects/mall-modernization/legal/Tenant_Agreement_Template.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1234567, auth.uid(), '/projects/mall-modernization/legal/', 1);

-- Update project progress based on task completion
UPDATE public.projects SET progress = (
  SELECT ROUND(AVG(completion_percentage))
  FROM public.project_tasks 
  WHERE project_id = projects.id
) WHERE id IN (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 
  'cccccccc-dddd-eeee-ffff-gggggggggggg',
  'dddddddd-eeee-ffff-aaaa-hhhhhhhhhhhh',
  'eeeeeeee-ffff-aaaa-bbbb-iiiiiiiiiiii',
  'ffffffff-aaaa-bbbb-cccc-jjjjjjjjjjjj'
);