-- Viết lại hoàn toàn: Tạo function để tạo room thay vì insert trực tiếp
-- 1. Tắt RLS INSERT policy (giữ lại các policy khác)
DROP POLICY IF EXISTS "users_insert_chat_rooms" ON public.chat_rooms;

-- 2. Tạo function để tạo room với SECURITY DEFINER (bypass RLS)
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
  -- Lấy user hiện tại
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Tạo room (bypass RLS vì SECURITY DEFINER)
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
    p_room_type::room_type,
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
  
  -- Tạo system message
  INSERT INTO public.chat_messages (
    chat_room_id,
    sender_id,
    content,
    message_type
  ) VALUES (
    v_room_id,
    v_user_id,
    'Created the room',
    'system'
  );
  
  RETURN v_room_id;
END;
$$;