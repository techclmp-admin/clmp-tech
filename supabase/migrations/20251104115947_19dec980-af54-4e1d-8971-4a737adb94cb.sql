-- Fix chat_rooms RLS policies
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;

-- Create proper INSERT policy that allows authenticated users to create rooms
-- The created_by will be automatically set by the default value auth.uid()
CREATE POLICY "Users can create chat rooms" 
ON public.chat_rooms 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Ensure created_by column has proper default
ALTER TABLE public.chat_rooms 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Make sure created_by is NOT NULL
ALTER TABLE public.chat_rooms 
ALTER COLUMN created_by SET NOT NULL;