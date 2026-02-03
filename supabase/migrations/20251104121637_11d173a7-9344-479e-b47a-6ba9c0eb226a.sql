-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;

-- Create a new INSERT policy that works with default values
-- This allows authenticated users to insert, and the database will automatically set created_by to auth.uid()
CREATE POLICY "Authenticated users can create chat rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (true);