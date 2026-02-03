-- Add DELETE policy for project_chat_rooms
-- Allow room creator or admins to delete rooms
CREATE POLICY "Creators can delete chat rooms"
ON public.project_chat_rooms
FOR DELETE
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'system_admin'::app_role)
);

-- Also add DELETE policy for chat_participants
CREATE POLICY "Room creators can delete participants"
ON public.chat_participants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM project_chat_rooms 
    WHERE id = chat_room_id 
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
  OR user_id = auth.uid()
);

-- Also add DELETE policy for chat_room_members
CREATE POLICY "Room creators can delete members"
ON public.chat_room_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM project_chat_rooms 
    WHERE id = room_id 
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
  OR user_id = auth.uid()
);