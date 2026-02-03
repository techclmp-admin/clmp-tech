-- Fix trigger to always set created_by to auth.uid()
DROP TRIGGER IF EXISTS set_chat_room_created_by_trigger ON public.chat_rooms;
DROP FUNCTION IF EXISTS public.set_chat_room_created_by();

-- Recreate function with simpler logic
CREATE OR REPLACE FUNCTION public.set_chat_room_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- ALWAYS set created_by to current authenticated user
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER set_chat_room_created_by_trigger
  BEFORE INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.set_chat_room_created_by();