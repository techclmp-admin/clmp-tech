-- Fix chat_rooms RLS by auto-setting created_by via trigger

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "enable_insert_for_authenticated_users" ON public.chat_rooms;

-- Create simpler INSERT policy that allows authenticated users
CREATE POLICY "Users can create rooms"
ON public.chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to auto-set created_by
CREATE OR REPLACE FUNCTION public.set_chat_room_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set created_by to current user
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-set created_by before insert
DROP TRIGGER IF EXISTS set_created_by_trigger ON public.chat_rooms;
CREATE TRIGGER set_created_by_trigger
BEFORE INSERT ON public.chat_rooms
FOR EACH ROW
EXECUTE FUNCTION public.set_chat_room_created_by();