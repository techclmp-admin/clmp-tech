-- Insert sample project templates
INSERT INTO public.project_templates (name, description, category, estimated_duration_days, tasks_template, is_active) VALUES
('Xây dựng nhà ở', 'Template cho dự án xây dựng nhà ở dân dụng', 'residential', 180, '[
  {"title": "Khảo sát địa chất", "description": "Thực hiện khảo sát địa chất công trình", "estimated_hours": 40, "priority": "high", "phase": "planning"},
  {"title": "Thiết kế kiến trúc", "description": "Thiết kế bản vẽ kiến trúc tổng thể", "estimated_hours": 120, "priority": "high", "phase": "design"},
  {"title": "Thiết kế kết cấu", "description": "Tính toán và thiết kế kết cấu công trình", "estimated_hours": 80, "priority": "high", "phase": "design"},
  {"title": "Đào móng", "description": "Thi công đào móng công trình", "estimated_hours": 160, "priority": "urgent", "phase": "construction"},
  {"title": "Đổ bê tông móng", "description": "Thi công đổ bê tông móng", "estimated_hours": 80, "priority": "urgent", "phase": "construction"},
  {"title": "Xây tường", "description": "Thi công xây tường các tầng", "estimated_hours": 240, "priority": "medium", "phase": "construction"},
  {"title": "Lắp đặt điện nước", "description": "Thi công hệ thống điện nước", "estimated_hours": 160, "priority": "medium", "phase": "installation"},
  {"title": "Hoàn thiện", "description": "Thi công hoàn thiện nội ngoại thất", "estimated_hours": 200, "priority": "medium", "phase": "finishing"}
]', true),

('Xây dựng thương mại', 'Template cho dự án xây dựng thương mại', 'commercial', 240, '[
  {"title": "Nghiên cứu khả thi", "description": "Lập báo cáo nghiên cứu khả thi dự án", "estimated_hours": 80, "priority": "high", "phase": "planning"},
  {"title": "Thiết kế sơ bộ", "description": "Thiết kế sơ bộ công trình", "estimated_hours": 160, "priority": "high", "phase": "design"},
  {"title": "Thiết kế kỹ thuật", "description": "Hoàn thiện thiết kế kỹ thuật", "estimated_hours": 200, "priority": "high", "phase": "design"},
  {"title": "Chuẩn bị mặt bằng", "description": "San lấp và chuẩn bị mặt bằng", "estimated_hours": 120, "priority": "high", "phase": "preparation"},
  {"title": "Thi công kết cấu", "description": "Thi công kết cấu chính", "estimated_hours": 400, "priority": "urgent", "phase": "construction"},
  {"title": "Hệ thống kỹ thuật", "description": "Lắp đặt các hệ thống kỹ thuật", "estimated_hours": 280, "priority": "medium", "phase": "installation"},
  {"title": "Kiểm tra chất lượng", "description": "Kiểm tra và nghiệm thu chất lượng", "estimated_hours": 40, "priority": "high", "phase": "testing"},
  {"title": "Bàn giao", "description": "Bàn giao công trình", "estimated_hours": 24, "priority": "medium", "phase": "completion"}
]', true),

('Cải tạo sửa chữa', 'Template cho dự án cải tạo và sửa chữa', 'renovation', 90, '[
  {"title": "Khảo sát hiện trạng", "description": "Khảo sát tình trạng công trình hiện tại", "estimated_hours": 24, "priority": "high", "phase": "assessment"},
  {"title": "Thiết kế cải tạo", "description": "Thiết kế phương án cải tạo", "estimated_hours": 60, "priority": "high", "phase": "design"},
  {"title": "Tháo dỡ", "description": "Tháo dỡ các bộ phận cũ", "estimated_hours": 80, "priority": "medium", "phase": "demolition"},
  {"title": "Sửa chữa kết cấu", "description": "Sửa chữa và gia cố kết cấu", "estimated_hours": 120, "priority": "high", "phase": "repair"},
  {"title": "Hoàn thiện mới", "description": "Thi công hoàn thiện theo thiết kế mới", "estimated_hours": 160, "priority": "medium", "phase": "finishing"}
]', true);

-- Insert sample projects with different statuses
INSERT INTO public.projects (
  name, description, status, priority, start_date, end_date, budget, 
  progress, created_by, project_manager_id, current_phase, client_id
) VALUES 
(
  'Chung cư Sunrise Tower', 
  'Dự án xây dựng chung cư cao cấp 25 tầng tại quận 1, TP.HCM với 200 căn hộ',
  'active', 
  'high', 
  '2024-01-15', 
  '2025-01-15', 
  15000000000,
  35,
  (SELECT auth.uid()),
  (SELECT auth.uid()),
  'construction',
  'CLT001'
),
(
  'Văn phòng Green Office', 
  'Tòa nhà văn phòng thông minh 15 tầng với công nghệ xanh',
  'active', 
  'medium', 
  '2024-03-01', 
  '2024-12-31', 
  8500000000,
  55,
  (SELECT auth.uid()),
  (SELECT auth.uid()),
  'installation',
  'CLT002'
),
(
  'Cải tạo Villa Heritage', 
  'Cải tạo biệt thự cổ thành không gian hiện đại giữ nguyên kiến trúc truyền thống',
  'completed', 
  'low', 
  '2023-10-01', 
  '2024-02-29', 
  2800000000,
  100,
  (SELECT auth.uid()),
  (SELECT auth.uid()),
  'completion',
  'CLT003'
),
(
  'Khu công nghiệp TechPark', 
  'Xây dựng khu công nghiệp công nghệ cao với 5 nhà xưởng và hạ tầng đồng bộ',
  'planning', 
  'urgent', 
  '2024-06-01', 
  '2025-08-31', 
  25000000000,
  10,
  (SELECT auth.uid()),
  (SELECT auth.uid()),
  'planning',
  'CLT004'
),
(
  'Trung tâm thương mại MegaMall', 
  'TTTM 8 tầng với khu vui chơi, siêu thị và nhà hàng',
  'on_hold', 
  'medium', 
  '2024-04-01', 
  '2025-06-30', 
  12000000000,
  25,
  (SELECT auth.uid()),
  (SELECT auth.uid()),
  'design',
  'CLT005'
);

-- Get the project IDs for creating tasks
DO $$
DECLARE
    sunrise_id UUID;
    green_office_id UUID;
    villa_heritage_id UUID;
    techpark_id UUID;
    megamall_id UUID;
BEGIN
    -- Get project IDs
    SELECT id INTO sunrise_id FROM projects WHERE name = 'Chung cư Sunrise Tower';
    SELECT id INTO green_office_id FROM projects WHERE name = 'Văn phòng Green Office';
    SELECT id INTO villa_heritage_id FROM projects WHERE name = 'Cải tạo Villa Heritage';
    SELECT id INTO techpark_id FROM projects WHERE name = 'Khu công nghiệp TechPark';
    SELECT id INTO megamall_id FROM projects WHERE name = 'Trung tâm thương mại MegaMall';

    -- Insert tasks for Sunrise Tower
    INSERT INTO public.project_tasks (project_id, title, description, status, priority, due_date, estimated_hours, completion_percentage, tags, created_by) VALUES
    (sunrise_id, 'Hoàn thiện tầng 15-20', 'Thi công hoàn thiện nội thất các tầng từ 15 đến 20', 'in_progress', 'high', '2024-02-15', 160, 70, ARRAY['construction', 'interior', 'urgent'], auth.uid()),
    (sunrise_id, 'Lắp đặt thang máy', 'Lắp đặt và vận hành thử 4 thang máy tốc độ cao', 'in_progress', 'urgent', '2024-02-28', 80, 45, ARRAY['elevator', 'installation'], auth.uid()),
    (sunrise_id, 'Kiểm tra an toàn PCCC', 'Kiểm tra và nghiệm thu hệ thống phòng cháy chữa cháy', 'todo', 'urgent', '2024-03-10', 24, 0, ARRAY['safety', 'fire-system'], auth.uid()),
    (sunrise_id, 'Hoàn thiện sảnh chính', 'Thi công hoàn thiện sảnh chính và khu vực tiếp khách', 'completed', 'medium', '2024-01-30', 120, 100, ARRAY['lobby', 'decoration'], auth.uid()),
    (sunrise_id, 'Kiểm tra hệ thống điện', 'Kiểm tra và hiệu chỉnh toàn bộ hệ thống điện', 'review', 'high', '2024-02-20', 40, 90, ARRAY['electrical', 'testing'], auth.uid());

    -- Insert tasks for Green Office
    INSERT INTO public.project_tasks (project_id, title, description, status, priority, due_date, estimated_hours, completion_percentage, tags, created_by) VALUES
    (green_office_id, 'Lắp đặt hệ thống IoT', 'Cài đặt sensors và thiết bị IoT cho tòa nhà thông minh', 'in_progress', 'high', '2024-03-15', 120, 60, ARRAY['iot', 'smart-building'], auth.uid()),
    (green_office_id, 'Hoàn thiện mặt ngoài', 'Thi công hoàn thiện mặt ngoài tòa nhà với vật liệu xanh', 'in_progress', 'medium', '2024-04-01', 200, 80, ARRAY['exterior', 'green-material'], auth.uid()),
    (green_office_id, 'Kiểm tra hệ thống HVAC', 'Vận hành thử và điều chỉnh hệ thống điều hòa không khí', 'todo', 'high', '2024-03-25', 60, 0, ARRAY['hvac', 'testing'], auth.uid()),
    (green_office_id, 'Cấp chứng chỉ xanh', 'Chuẩn bị hồ sơ xin cấp chứng chỉ công trình xanh', 'todo', 'medium', '2024-05-15', 40, 0, ARRAY['certification', 'documentation'], auth.uid());

    -- Insert tasks for Villa Heritage (completed project)
    INSERT INTO public.project_tasks (project_id, title, description, status, priority, due_date, estimated_hours, completion_percentage, tags, created_by) VALUES
    (villa_heritage_id, 'Phục hồi kiến trúc cổ', 'Phục hồi các chi tiết kiến trúc cổ điển', 'completed', 'high', '2024-01-15', 180, 100, ARRAY['restoration', 'heritage'], auth.uid()),
    (villa_heritage_id, 'Cải tạo hệ thống điện', 'Thay thế toàn bộ hệ thống điện cũ', 'completed', 'urgent', '2024-02-01', 100, 100, ARRAY['electrical', 'renovation'], auth.uid()),
    (villa_heritage_id, 'Hoàn thiện nội thất', 'Thiết kế và hoàn thiện nội thất theo phong cách hiện đại', 'completed', 'medium', '2024-02-20', 150, 100, ARRAY['interior', 'modern'], auth.uid());

    -- Insert tasks for TechPark
    INSERT INTO public.project_tasks (project_id, title, description, status, priority, due_date, estimated_hours, completion_percentage, tags, created_by) VALUES
    (techpark_id, 'Khảo sát địa chất', 'Thực hiện khảo sát địa chất toàn khu vực', 'in_progress', 'urgent', '2024-02-29', 80, 75, ARRAY['survey', 'geology'], auth.uid()),
    (techpark_id, 'Thiết kế tổng thể', 'Hoàn thiện thiết kế tổng thể khu công nghiệp', 'todo', 'high', '2024-03-30', 200, 0, ARRAY['design', 'master-plan'], auth.uid()),
    (techpark_id, 'Báo cáo đánh giá môi trường', 'Lập báo cáo đánh giá tác động môi trường', 'todo', 'high', '2024-04-15', 120, 0, ARRAY['environment', 'assessment'], auth.uid());

    -- Insert tasks for MegaMall
    INSERT INTO public.project_tasks (project_id, title, description, status, priority, due_date, estimated_hours, completion_percentage, tags, created_by) VALUES
    (megamall_id, 'Thiết kế kiến trúc', 'Hoàn thiện thiết kế kiến trúc TTTM', 'in_progress', 'high', '2024-03-20', 150, 40, ARRAY['architecture', 'commercial'], auth.uid()),
    (megamall_id, 'Nghiên cứu thị trường', 'Phân tích thị trường và khách hàng mục tiêu', 'completed', 'medium', '2024-02-10', 60, 100, ARRAY['market-research', 'analysis'], auth.uid()),
    (megamall_id, 'Thiết kế hệ thống an ninh', 'Thiết kế hệ thống camera và an ninh toàn TTTM', 'todo', 'high', '2024-04-01', 80, 0, ARRAY['security', 'surveillance'], auth.uid());

END $$;

-- Insert project files (simulated)
DO $$
DECLARE
    sunrise_id UUID;
    green_office_id UUID;
    villa_heritage_id UUID;
BEGIN
    SELECT id INTO sunrise_id FROM projects WHERE name = 'Chung cư Sunrise Tower';
    SELECT id INTO green_office_id FROM projects WHERE name = 'Văn phòng Green Office';
    SELECT id INTO villa_heritage_id FROM projects WHERE name = 'Cải tạo Villa Heritage';

    INSERT INTO public.project_files (project_id, file_name, file_url, file_type, file_size, category, description, uploaded_by) VALUES
    (sunrise_id, 'Bản vẽ tổng thể tầng 1-5.dwg', 'https://example.com/sunrise-floor-1-5.dwg', 'application/acad', 2457600, 'drawings', 'Bản vẽ kiến trúc chi tiết các tầng từ 1 đến 5', auth.uid()),
    (sunrise_id, 'Báo cáo tiến độ tháng 1.pdf', 'https://example.com/sunrise-progress-jan.pdf', 'application/pdf', 1024000, 'reports', 'Báo cáo tiến độ thi công tháng 1/2024', auth.uid()),
    (sunrise_id, 'Hình ảnh thi công thực tế.jpg', 'https://example.com/sunrise-photos.jpg', 'image/jpeg', 5242880, 'photos', 'Hình ảnh chụp tiến độ thi công thực tế', auth.uid()),
    
    (green_office_id, 'Thiết kế hệ thống IoT.pdf', 'https://example.com/green-iot-design.pdf', 'application/pdf', 3145728, 'technical', 'Thiết kế chi tiết hệ thống IoT và cảm biến', auth.uid()),
    (green_office_id, 'Chứng chỉ vật liệu xanh.pdf', 'https://example.com/green-materials-cert.pdf', 'application/pdf', 512000, 'certificates', 'Chứng chỉ vật liệu xanh đã sử dụng', auth.uid()),
    
    (villa_heritage_id, 'Hồ sơ hoàn công.zip', 'https://example.com/villa-completion.zip', 'application/zip', 10485760, 'completion', 'Hồ sơ hoàn công đầy đủ của dự án', auth.uid());

END $$;

-- Update progress for projects based on completed tasks
UPDATE public.projects 
SET progress = (
    SELECT COALESCE(AVG(completion_percentage), 0)
    FROM public.project_tasks 
    WHERE project_tasks.project_id = projects.id
)
WHERE id IN (
    SELECT DISTINCT project_id FROM public.project_tasks
);