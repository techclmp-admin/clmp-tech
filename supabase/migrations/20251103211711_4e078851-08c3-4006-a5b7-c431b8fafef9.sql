-- Drop the old INSERT policy
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;

-- Create new INSERT policy that allows null created_by (will be set by default)
CREATE POLICY "Users can create chat rooms" 
ON chat_rooms 
FOR INSERT 
WITH CHECK (created_by IS NULL OR created_by = auth.uid());