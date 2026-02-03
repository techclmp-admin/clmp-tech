-- Fix infinite recursion in RLS policies by moving self-referential EXISTS checks into SECURITY DEFINER helper functions

-- 1) Helper: chat_participants membership check (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_chat_room_participant(_chat_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_participants
    WHERE chat_room_id = _chat_room_id
      AND user_id = _user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_chat_room_participant(uuid, uuid) TO public;

-- Replace the recursive policy on chat_participants
DROP POLICY IF EXISTS "Participants can view" ON public.chat_participants;
CREATE POLICY "Participants can view"
ON public.chat_participants
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_chat_room_participant(chat_room_id, auth.uid())
);

-- 2) Optional hardening: fix similar recursion pattern on chat_room_members (prevents future issues)
CREATE OR REPLACE FUNCTION public.is_chat_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_room_members
    WHERE room_id = _room_id
      AND user_id = _user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_chat_room_member(uuid, uuid) TO public;

DROP POLICY IF EXISTS "Users can view room members" ON public.chat_room_members;
CREATE POLICY "Users can view room members"
ON public.chat_room_members
FOR SELECT
USING (
  public.is_chat_room_member(room_id, auth.uid())
);
