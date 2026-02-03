-- Drop and recreate the INSERT policy with public role
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;

CREATE POLICY "Users can create chat rooms" 
ON public.chat_rooms 
FOR INSERT 
TO public
WITH CHECK (auth.uid() IS NOT NULL);