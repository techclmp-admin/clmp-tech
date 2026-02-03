-- Remove the default value from created_by column
ALTER TABLE public.chat_rooms 
ALTER COLUMN created_by DROP DEFAULT;

-- Create a trigger function to auto-set created_by
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set created_by if it's not already provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run before insert
DROP TRIGGER IF EXISTS set_chat_room_created_by ON public.chat_rooms;
CREATE TRIGGER set_chat_room_created_by
  BEFORE INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by();