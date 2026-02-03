-- Add default value for created_by in chat_rooms if not already set
ALTER TABLE chat_rooms 
ALTER COLUMN created_by SET DEFAULT auth.uid();