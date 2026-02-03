-- Complete fix: Ensure trigger exists and works
-- 1. Drop and recreate function
DROP FUNCTION IF EXISTS public.set_chat_room_created_by() CASCADE;

CREATE FUNCTION public.set_chat_room_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Set created_by to current authenticated user
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

-- 2. Create trigger
CREATE TRIGGER set_chat_room_created_by_trigger
  BEFORE INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.set_chat_room_created_by();

-- 3. Verify RLS is enabled
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies
DROP POLICY IF EXISTS "users_insert_chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "users_select_chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "creators_update_chat_rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "creators_delete_chat_rooms" ON public.chat_rooms;

-- 5. Recreate policies with correct logic
CREATE POLICY "users_insert_chat_rooms" 
ON public.chat_rooms 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "users_select_chat_rooms" 
ON public.chat_rooms 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.chat_room_id = chat_rooms.id
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "creators_update_chat_rooms" 
ON public.chat_rooms 
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "creators_delete_chat_rooms" 
ON public.chat_rooms 
FOR DELETE 
TO authenticated
USING (created_by = auth.uid());