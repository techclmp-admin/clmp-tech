-- Fix chat_participants INSERT RLS to allow room creators to add participants
-- and align create_chat_room() to use project_chat_rooms (since chat_participants FK points there).

-- 1) Update create_chat_room to insert into public.project_chat_rooms instead of public.chat_rooms
CREATE OR REPLACE FUNCTION public.create_chat_room(
  p_name text,
  p_description text DEFAULT NULL::text,
  p_project_id uuid DEFAULT NULL::uuid,
  p_is_private boolean DEFAULT false,
  p_room_type text DEFAULT 'group'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_room_id UUID;
BEGIN
  INSERT INTO public.project_chat_rooms (name, description, project_id, is_private, room_type, created_by)
  VALUES (p_name, p_description, p_project_id, p_is_private, p_room_type, auth.uid())
  RETURNING id INTO v_room_id;

  -- Add creator as participant
  INSERT INTO public.chat_participants (chat_room_id, user_id, role)
  VALUES (v_room_id, auth.uid(), 'admin');

  RETURN v_room_id;
END;
$$;

-- 2) Update RLS policy for INSERT on chat_participants
DROP POLICY IF EXISTS "Users can join rooms" ON public.chat_participants;
CREATE POLICY "Users can join rooms"
ON public.chat_participants
FOR INSERT
WITH CHECK (
  -- user can always add themselves
  user_id = auth.uid()
  -- room creator can add other users to the room
  OR EXISTS (
    SELECT 1
    FROM public.project_chat_rooms r
    WHERE r.id = chat_participants.chat_room_id
      AND r.created_by = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
