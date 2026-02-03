-- Update DELETE policy for chat_messages to allow room creators to delete all messages in their rooms
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

CREATE POLICY "Users can delete messages in their rooms"
ON chat_messages
FOR DELETE
TO public
USING (
  sender_id = auth.uid() 
  OR chat_room_id IN (
    SELECT id FROM chat_rooms WHERE created_by = auth.uid()
  )
);