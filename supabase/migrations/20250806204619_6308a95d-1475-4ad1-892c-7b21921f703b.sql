-- Add some real weather alerts and activity feed data to connect Dashboard and Alerts page
INSERT INTO weather_alerts (
  alert_type, title, description, severity, active, location, 
  start_time, end_time, weather_conditions, impact_description
) VALUES 
(
  'wind', 'High Wind Warning', 'Strong winds expected (35+ mph). Consider postponing crane operations.',
  'high', true, 'Toronto, ON',
  NOW(), NOW() + INTERVAL '24 hours',
  jsonb_build_object('wind_speed', '35-45', 'gusts', '50'),
  'May affect crane and high-rise construction work'
),
(
  'storm', 'Thunderstorm Watch', 'Severe thunderstorms possible. Suspend outdoor electrical work.',
  'medium', true, 'Hamilton, ON',
  NOW() + INTERVAL '12 hours', NOW() + INTERVAL '18 hours',
  jsonb_build_object('precipitation', 'heavy', 'lightning', 'yes'),
  'Electrical and roofing work should be suspended'
),
(
  'temperature', 'Extreme Cold Warning', 'Temperatures below -25°C. Additional heating requirements for concrete work.',
  'medium', true, 'Ottawa, ON', 
  NOW(), NOW() + INTERVAL '48 hours',
  jsonb_build_object('temperature', '-28', 'wind_chill', '-35'),
  'Concrete pouring and curing may be affected'
);

-- Add activity feed entries that link to weather alerts and projects
INSERT INTO activity_feed (
  user_id, title, description, activity_type, activity_category, 
  priority, project_id, metadata
) VALUES 
(
  '2fc4b91d-40b1-41db-ae55-460217bd36ee',
  'Safety Equipment Inspection Due',
  'Hard hats and safety vests require inspection within 48 hours',
  'safety_inspection', 'alert',
  'high', '9f832d53-cbfa-4202-8f8b-747155c4f23b',
  jsonb_build_object('due_hours', 48, 'equipment_type', 'ppe')
),
(
  '2fc4b91d-40b1-41db-ae55-460217bd36ee',
  'Budget Threshold Alert',
  'Project budget has exceeded 85% of allocated funds', 
  'budget_alert', 'alert',
  'medium', '9f832d53-cbfa-4202-8f8b-747155c4f23b',
  jsonb_build_object('threshold', 85, 'current_usage', 87)
),
(
  '2fc4b91d-40b1-41db-ae55-460217bd36ee',
  'Weather Alert: High Winds',
  'Strong winds expected tomorrow (35+ mph). Consider postponing crane operations.',
  'weather_alert', 'alert',
  'high', '9f832d53-cbfa-4202-8f8b-747155c4f23b',
  jsonb_build_object('wind_speed', '35-45', 'location', 'Toronto')
);