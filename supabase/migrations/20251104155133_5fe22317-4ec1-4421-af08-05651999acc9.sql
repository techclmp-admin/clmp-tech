-- Xóa hoàn toàn tất cả dữ liệu chat
TRUNCATE TABLE public.chat_messages CASCADE;
TRUNCATE TABLE public.chat_participants CASCADE;
TRUNCATE TABLE public.chat_rooms CASCADE;