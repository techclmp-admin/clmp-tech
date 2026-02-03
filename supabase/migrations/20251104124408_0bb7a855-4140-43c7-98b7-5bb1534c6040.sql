-- Fix chat_rooms INSERT policy
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON public.chat_rooms;

CREATE POLICY "enable_insert_for_authenticated_users" 
ON public.chat_rooms
FOR INSERT 
TO authenticated
WITH CHECK (created_by = auth.uid());