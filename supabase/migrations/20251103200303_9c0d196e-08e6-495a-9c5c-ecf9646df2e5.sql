-- Update SELECT policy for chat_rooms to work without chat_participants table
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON chat_rooms;

CREATE POLICY "Users can view their rooms"
ON chat_rooms
FOR SELECT
TO public
USING (
  -- User created the room
  created_by = auth.uid()
  OR 
  -- User has messages in the room
  id IN (
    SELECT DISTINCT chat_room_id 
    FROM chat_messages 
    WHERE sender_id = auth.uid()
  )
);