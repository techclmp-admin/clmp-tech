-- Simplify INSERT policy for chat_rooms
-- Allow authenticated users to create rooms (created_by will be set automatically)

DROP POLICY IF EXISTS "Users can create rooms" ON public.chat_rooms;

CREATE POLICY "Users can create rooms" 
ON public.chat_rooms 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Ensure created_by is always set correctly via trigger
CREATE OR REPLACE FUNCTION public.set_chat_room_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS set_chat_room_created_by_trigger ON public.chat_rooms;

-- Create trigger to set created_by
CREATE TRIGGER set_chat_room_created_by_trigger
  BEFORE INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.set_chat_room_created_by();