-- Xóa các policies cũ gây infinite recursion
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can add participants to their rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation or room admins can upd" ON public.chat_participants;
DROP POLICY IF EXISTS "Room admins can remove participants" ON public.chat_participants;

-- Tạo policies mới đơn giản hơn, không gây infinite recursion

-- 1. SELECT: Authenticated users có thể xem participants (team chat nội bộ)
CREATE POLICY "Authenticated users can view participants"
ON public.chat_participants
FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT: Chỉ cho phép nếu user là creator của room HOẶC đang thêm chính mình
CREATE POLICY "Users can add participants to their rooms"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- User là creator của room
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = chat_room_id 
    AND cr.created_by = auth.uid()
  )
);

-- 3. UPDATE: Chỉ có thể update chính mình hoặc nếu là room creator
CREATE POLICY "Users can update participants"
ON public.chat_participants
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() -- Update chính mình
  OR
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = chat_room_id 
    AND cr.created_by = auth.uid() -- Hoặc là room creator
  )
);

-- 4. DELETE: Chỉ có thể xóa chính mình hoặc nếu là room creator
CREATE POLICY "Users can remove participants"
ON public.chat_participants
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() -- Xóa chính mình (rời room)
  OR
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr
    WHERE cr.id = chat_room_id 
    AND cr.created_by = auth.uid() -- Hoặc là room creator
  )
);