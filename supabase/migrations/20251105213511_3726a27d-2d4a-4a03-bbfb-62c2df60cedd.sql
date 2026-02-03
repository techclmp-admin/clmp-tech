-- Drop the existing foreign key to auth.users
ALTER TABLE public.project_members
DROP CONSTRAINT project_members_user_id_fkey;

-- Add new foreign key to profiles table
ALTER TABLE public.project_members
ADD CONSTRAINT project_members_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;