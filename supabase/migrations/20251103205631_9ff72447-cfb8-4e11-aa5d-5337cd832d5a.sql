-- Fix get_user_chat_room_ids to include rooms where user is a participant
CREATE OR REPLACE FUNCTION public.get_user_chat_room_ids(_user_id uuid)
RETURNS TABLE(room_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Get rooms where user is a participant (PRIMARY SOURCE)
  SELECT chat_room_id as room_id 
  FROM public.chat_participants 
  WHERE user_id = _user_id
  
  UNION
  
  -- Get rooms where user is the creator (backup - should already be in participants)
  SELECT id as room_id 
  FROM public.chat_rooms 
  WHERE created_by = _user_id
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.get_user_chat_room_ids(uuid) IS 
'Returns all chat room IDs that a user has access to via participation or creation';
