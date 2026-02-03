-- Add activity feed entries with correct categories
INSERT INTO activity_feed (
  user_id, title, description, activity_type, activity_category, 
  priority, project_id, metadata
) VALUES 
(
  '2fc4b91d-40b1-41db-ae55-460217bd36ee',
  'Safety Equipment Inspection Due',
  'Hard hats and safety vests require inspection within 48 hours',
  'safety_inspection', 'project',
  'high', '9f832d53-cbfa-4202-8f8b-747155c4f23b',
  jsonb_build_object('due_hours', 48, 'equipment_type', 'ppe')
),
(
  '2fc4b91d-40b1-41db-ae55-460217bd36ee',
  'Budget Threshold Alert',
  'Project budget has exceeded 85% of allocated funds', 
  'budget_alert', 'project',
  'medium', '9f832d53-cbfa-4202-8f8b-747155c4f23b',
  jsonb_build_object('threshold', 85, 'current_usage', 87)
),
(
  '2fc4b91d-40b1-41db-ae55-460217bd36ee',
  'Weather Alert: High Winds',
  'Strong winds expected tomorrow (35+ mph). Consider postponing crane operations.',
  'weather_alert', 'project',
  'high', '9f832d53-cbfa-4202-8f8b-747155c4f23b',
  jsonb_build_object('wind_speed', '35-45', 'location', 'Toronto')
);