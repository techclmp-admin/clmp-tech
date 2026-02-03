-- Xóa tất cả dữ liệu chat để bắt đầu lại từ đầu
-- Xóa theo thứ tự đúng để tránh foreign key constraint errors

-- 1. Xóa tất cả messages
DELETE FROM public.chat_messages;

-- 2. Xóa tất cả participants
DELETE FROM public.chat_participants;

-- 3. Xóa tất cả rooms
DELETE FROM public.chat_rooms;