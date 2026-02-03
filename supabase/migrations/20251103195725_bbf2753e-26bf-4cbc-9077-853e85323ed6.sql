-- Drop old policies that reference chat_participants
DROP POLICY IF EXISTS "Users can insert chat messages in their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can view chat messages in their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Room creators and admins can delete rooms" ON chat_rooms;

-- Create new DELETE policy for chat_messages
CREATE POLICY "Users can delete their own messages"
ON chat_messages
FOR DELETE
TO public
USING (sender_id = auth.uid());

-- Create new policies for chat_messages based on room membership (via messages)
CREATE POLICY "Users can insert chat messages"
ON chat_messages
FOR INSERT
TO public
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view chat messages"
ON chat_messages
FOR SELECT
TO public
USING (
  chat_room_id IN (
    SELECT DISTINCT chat_room_id 
    FROM chat_messages 
    WHERE sender_id = auth.uid()
  )
  OR chat_room_id IN (
    SELECT id FROM chat_rooms WHERE created_by = auth.uid()
  )
);

-- Simplify the DELETE policy for rooms to only allow creators
DROP POLICY IF EXISTS "Room creators and admins can delete rooms" ON chat_rooms;

CREATE POLICY "Room creators can delete rooms"
ON chat_rooms
FOR DELETE
TO public
USING (created_by = auth.uid());