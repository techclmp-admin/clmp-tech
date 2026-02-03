-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;

-- Create a simpler INSERT policy that just checks authentication
CREATE POLICY "Users can create chat rooms" 
ON public.chat_rooms 
FOR INSERT 
TO authenticated
WITH CHECK (true);