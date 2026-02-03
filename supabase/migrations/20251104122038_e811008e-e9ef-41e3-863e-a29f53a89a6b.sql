-- Drop ALL existing policies on chat_rooms
DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view their rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators can update rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room creators can delete rooms" ON public.chat_rooms;

-- Create simple, working policies
-- INSERT: Any authenticated user can insert, no restrictions
CREATE POLICY "enable_insert_for_authenticated_users"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (true);

-- SELECT: Users can see rooms they participate in
CREATE POLICY "enable_select_for_participants"
ON public.chat_rooms
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT room_id 
    FROM get_user_chat_room_ids(auth.uid())
  )
);

-- UPDATE: Only room creator can update
CREATE POLICY "enable_update_for_creators"
ON public.chat_rooms
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- DELETE: Only room creator can delete
CREATE POLICY "enable_delete_for_creators"
ON public.chat_rooms
FOR DELETE
TO authenticated
USING (created_by = auth.uid());