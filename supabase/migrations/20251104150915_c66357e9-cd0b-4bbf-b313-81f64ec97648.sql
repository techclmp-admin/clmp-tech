-- Fix INSERT policy for chat_rooms to allow users to create rooms
-- The created_by column has a default of auth.uid(), so we need to ensure the policy allows this

DROP POLICY IF EXISTS "Users can create rooms" ON public.chat_rooms;

CREATE POLICY "Users can create rooms" 
ON public.chat_rooms 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Also ensure the INSERT includes created_by or relies on the default
-- Since the default is auth.uid(), the policy will pass automatically