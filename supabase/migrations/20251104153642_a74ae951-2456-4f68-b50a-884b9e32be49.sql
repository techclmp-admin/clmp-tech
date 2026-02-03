-- Sửa function: Bỏ message_type nếu không tồn tại
CREATE OR REPLACE FUNCTION public.create_chat_room(
  p_name text,
  p_description text DEFAULT NULL,
  p_room_type text DEFAULT 'group',
  p_project_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_room_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Tạo room
  INSERT INTO public.chat_rooms (
    name,
    description,
    room_type,
    project_id,
    is_active,
    created_by
  ) VALUES (
    p_name,
    p_description,
    p_room_type,
    p_project_id,
    true,
    v_user_id
  ) RETURNING id INTO v_room_id;
  
  -- Thêm creator làm admin participant
  INSERT INTO public.chat_participants (
    chat_room_id,
    user_id,
    role
  ) VALUES (
    v_room_id,
    v_user_id,
    'admin'
  );
  
  -- Tạo system message (chỉ với các columns tồn tại)
  INSERT INTO public.chat_messages (
    chat_room_id,
    sender_id,
    content
  ) VALUES (
    v_room_id,
    v_user_id,
    'Created the room'
  );
  
  RETURN v_room_id;
END;
$$;