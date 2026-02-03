-- Insert configuration features into global_feature_settings
INSERT INTO public.global_feature_settings (feature_key, feature_name, display_name, description, category, enabled, is_enabled, show_in_sidebar, sort_order)
VALUES 
  -- Authentication Features
  ('google_signin', 'Google Sign In', 'Google Sign In', 'Cho phép đăng nhập bằng Google OAuth', 'authentication', true, true, false, 100),
  ('magic_link', 'Magic Link Login', 'Magic Link', 'Cho phép đăng nhập bằng Magic Link qua email', 'authentication', true, true, false, 101),
  ('email_password', 'Email/Password Login', 'Email/Password', 'Cho phép đăng nhập bằng email và mật khẩu', 'authentication', true, true, false, 102),
  
  -- App Features
  ('pwa', 'PWA Installation', 'PWA', 'Hiển thị gợi ý cài đặt ứng dụng và trang Install', 'app', true, true, true, 200),
  ('dark_mode', 'Dark Mode', 'Dark Mode', 'Cho phép chuyển đổi chế độ sáng/tối', 'app', true, true, false, 201),
  ('notifications', 'Notifications', 'Thông báo', 'Hệ thống thông báo trong ứng dụng', 'app', true, true, true, 202)
ON CONFLICT (feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order;