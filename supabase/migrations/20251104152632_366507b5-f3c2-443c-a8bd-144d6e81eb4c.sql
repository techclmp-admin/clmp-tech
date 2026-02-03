-- Clean up duplicate triggers
DROP TRIGGER IF EXISTS set_chat_room_created_by ON public.chat_rooms;
DROP TRIGGER IF EXISTS set_created_by_trigger ON public.chat_rooms;

-- Keep only the correct trigger
-- (set_chat_room_created_by_trigger already exists and is correct)