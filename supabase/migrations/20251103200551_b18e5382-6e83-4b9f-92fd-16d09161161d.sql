-- Create security definer function to get user's room IDs
CREATE OR REPLACE FUNCTION public.get_user_chat_room_ids(_user_id uuid)
RETURNS TABLE (room_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get rooms where user is the creator
  SELECT id as room_id FROM chat_rooms WHERE created_by = _user_id
  UNION
  -- Get rooms where user has sent messages
  SELECT DISTINCT chat_room_id as room_id FROM chat_messages WHERE sender_id = _user_id
$$;

-- Update the SELECT policy for chat_messages to use the function
DROP POLICY IF EXISTS "Users can view chat messages" ON chat_messages;

CREATE POLICY "Users can view chat messages"
ON chat_messages
FOR SELECT
TO public
USING (
  chat_room_id IN (
    SELECT room_id FROM public.get_user_chat_room_ids(auth.uid())
  )
);

-- Also update the SELECT policy for chat_rooms to use simpler logic
DROP POLICY IF EXISTS "Users can view their rooms" ON chat_rooms;

CREATE POLICY "Users can view their rooms"
ON chat_rooms
FOR SELECT
TO public
USING (
  id IN (
    SELECT room_id FROM public.get_user_chat_room_ids(auth.uid())
  )
);