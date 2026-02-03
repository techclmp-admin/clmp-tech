-- Fix chat_participants INSERT policy to avoid circular dependency
DROP POLICY IF EXISTS "Users can add participants to their rooms" ON public.chat_participants;

CREATE POLICY "Users can add participants to their rooms" 
ON public.chat_participants
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Can add yourself
  user_id = auth.uid() 
  OR 
  -- Or you are the room creator (using security definer function)
  EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = chat_room_id 
    AND created_by = auth.uid()
  )
);