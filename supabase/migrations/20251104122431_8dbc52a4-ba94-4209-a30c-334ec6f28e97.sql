-- Add back the default value for created_by
ALTER TABLE public.chat_rooms 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- The trigger is still good as a backup, but now we have default value too
-- The INSERT policy already allows authenticated users with WITH CHECK (true)