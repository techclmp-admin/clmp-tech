-- Drop function with CASCADE to remove dependent policies
DROP FUNCTION IF EXISTS public.get_user_chat_room_ids(uuid) CASCADE;

-- Recreate the function with search_path set
CREATE OR REPLACE FUNCTION public.get_user_chat_room_ids(_user_id UUID)
RETURNS TABLE(room_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT chat_room_id as room_id
  FROM public.chat_participants
  WHERE user_id = _user_id;
$$;

-- Recreate the SELECT policy for chat_rooms
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

-- Recreate the SELECT policy for chat_messages
CREATE POLICY "Users can view chat messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  chat_room_id IN (
    SELECT room_id 
    FROM get_user_chat_room_ids(auth.uid())
  )
);