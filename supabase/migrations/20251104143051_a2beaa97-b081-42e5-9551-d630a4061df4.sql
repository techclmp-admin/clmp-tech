-- Fix chat_rooms RLS - remove trigger and rely on database default

-- Drop the trigger and function
DROP TRIGGER IF EXISTS set_created_by_trigger ON public.chat_rooms;
DROP FUNCTION IF EXISTS public.set_chat_room_created_by();

-- The created_by column already has default auth.uid()
-- So we don't need the trigger, just ensure INSERT policy is correct

DROP POLICY IF EXISTS "Users can create rooms" ON public.chat_rooms;

-- Simple INSERT policy for authenticated users
CREATE POLICY "Users can create rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (true);