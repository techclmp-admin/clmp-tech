-- Complete fix for chat_rooms RLS and trigger issues

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can create rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "enable_delete_for_creators" ON public.chat_rooms;
DROP POLICY IF EXISTS "enable_select_for_participants" ON public.chat_rooms;
DROP POLICY IF EXISTS "enable_update_for_creators" ON public.chat_rooms;

-- 2. Drop existing triggers
DROP TRIGGER IF EXISTS set_chat_room_created_by_trigger ON public.chat_rooms;
DROP TRIGGER IF EXISTS set_created_by_trigger ON public.chat_rooms;

-- 3. Create/update the trigger function
CREATE OR REPLACE FUNCTION public.set_chat_room_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Always set created_by to current user if not explicitly provided
  IF NEW.created_by IS NULL OR NEW.created_by != auth.uid() THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Create trigger (BEFORE INSERT to run before RLS check)
CREATE TRIGGER set_chat_room_created_by_trigger
  BEFORE INSERT ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.set_chat_room_created_by();

-- 5. Create simple, permissive policies

-- Allow authenticated users to INSERT (trigger will set created_by)
CREATE POLICY "users_insert_chat_rooms" 
ON public.chat_rooms 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to SELECT rooms they're participants in
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

-- Allow creators to UPDATE their rooms
CREATE POLICY "creators_update_chat_rooms" 
ON public.chat_rooms 
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Allow creators to DELETE their rooms
CREATE POLICY "creators_delete_chat_rooms" 
ON public.chat_rooms 
FOR DELETE 
TO authenticated
USING (created_by = auth.uid());