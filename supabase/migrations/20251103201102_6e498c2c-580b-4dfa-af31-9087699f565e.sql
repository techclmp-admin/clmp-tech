-- Enable realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Set replica identity to FULL for complete row data during updates
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- Also enable for chat_rooms  
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER TABLE chat_rooms REPLICA IDENTITY FULL;