-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Update existing profiles with email from auth.users
UPDATE public.profiles 
SET email = auth_users.email
FROM auth.users auth_users
WHERE public.profiles.id = auth_users.id;

-- Add unique constraint on email
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);