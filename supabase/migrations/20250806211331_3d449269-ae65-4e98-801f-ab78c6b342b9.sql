-- Add sample construction projects for Ontario, Canada
INSERT INTO projects (
  id, name, description, status, priority, start_date, end_date, 
  budget, progress, created_by, project_manager_id, location, category
) VALUES 
('11111111-1111-1111-1111-111111111111', 'Luxury Family Home - Toronto', 'Custom 3,500 sq ft family home with modern amenities in Toronto', 'active', 'high', '2024-01-15', '2024-08-30', 850000, 75, '2fc4b91d-40b1-41db-ae55-460217bd36ee', '2fc4b91d-40b1-41db-ae55-460217bd36ee', 'Toronto, ON', 'residential'),
('22222222-2222-2222-2222-222222222222', 'Townhouse Development - Ottawa', '24-unit townhouse development in Ottawa suburbs', 'active', 'high', '2024-02-01', '2024-12-15', 2400000, 45, '2fc4b91d-40b1-41db-ae55-460217bd36ee', '2fc4b91d-40b1-41db-ae55-460217bd36ee', 'Ottawa, ON', 'residential'),
('33333333-3333-3333-3333-333333333333', 'Office Building - Hamilton', '6-story commercial office building with retail ground floor', 'active', 'medium', '2024-03-01', '2025-01-31', 3200000, 60, '2fc4b91d-40b1-41db-ae55-460217bd36ee', '2fc4b91d-40b1-41db-ae55-460217bd36ee', 'Hamilton, ON', 'commercial'),
('44444444-4444-4444-4444-444444444444', 'Shopping Center - London', 'Regional shopping center with anchor stores', 'active', 'urgent', '2024-01-10', '2024-11-30', 4500000, 35, '2fc4b91d-40b1-41db-ae55-460217bd36ee', '2fc4b91d-40b1-41db-ae55-460217bd36ee', 'London, ON', 'commercial'),
('55555555-5555-5555-5555-555555555555', 'Automotive Manufacturing - Kitchener', '200,000 sq ft automotive parts manufacturing facility', 'active', 'high', '2024-02-15', '2025-03-31', 6800000, 25, '2fc4b91d-40b1-41db-ae55-460217bd36ee', '2fc4b91d-40b1-41db-ae55-460217bd36ee', 'Kitchener, ON', 'industrial'),
('66666666-6666-6666-6666-666666666666', 'Highway Overpass - Windsor', '4-lane highway overpass construction', 'active', 'urgent', '2024-04-01', '2025-06-30', 8200000, 15, '2fc4b91d-40b1-41db-ae55-460217bd36ee', '2fc4b91d-40b1-41db-ae55-460217bd36ee', 'Windsor, ON', 'infrastructure'),
('77777777-7777-7777-7777-777777777777', 'Hospital Emergency Wing - Toronto', 'Complete renovation of emergency department', 'completed', 'urgent', '2023-09-01', '2024-02-28', 1200000, 100, '2fc4b91d-40b1-41db-ae55-460217bd36ee', '2fc4b91d-40b1-41db-ae55-460217bd36ee', 'Toronto, ON', 'renovation'),
('88888888-8888-8888-8888-888888888888', 'Condo Tower - Toronto', '42-story residential tower with 380 units', 'on_hold', 'high', '2024-05-01', '2026-12-31', 15600000, 5, '2fc4b91d-40b1-41db-ae55-460217bd36ee', '2fc4b91d-40b1-41db-ae55-460217bd36ee', 'Toronto, ON', 'high_rise')

ON CONFLICT (id) DO NOTHING;