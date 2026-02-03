-- Ensure member_code is unique and indexed
CREATE UNIQUE INDEX IF NOT EXISTS profiles_member_code_unique 
ON public.profiles(member_code) 
WHERE member_code IS NOT NULL;

-- Add comment to document the purpose
COMMENT ON INDEX profiles_member_code_unique IS 'Ensures member codes are unique across all profiles';

-- Update any profiles that don't have a member_code yet
UPDATE public.profiles
SET member_code = public.generate_member_code()
WHERE member_code IS NULL;
