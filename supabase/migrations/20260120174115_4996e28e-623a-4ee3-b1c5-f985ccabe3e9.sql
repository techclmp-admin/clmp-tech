-- Fix chat_messages RLS: use chat_participants membership (and keep chat_room_members compatibility)

DROP POLICY IF EXISTS "Room members can view messages" ON public.chat_messages;
CREATE POLICY "Room members can view messages"
ON public.chat_messages
FOR SELECT
USING (
  public.is_chat_room_participant(chat_messages.room_id, auth.uid())
  OR public.is_chat_room_member(chat_messages.room_id, auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Room members can send messages" ON public.chat_messages;
CREATE POLICY "Room members can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (
    public.is_chat_room_participant(chat_messages.room_id, auth.uid())
    OR public.is_chat_room_member(chat_messages.room_id, auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);
