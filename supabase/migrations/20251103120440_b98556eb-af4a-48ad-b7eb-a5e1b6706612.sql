-- Add member_code to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS member_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_member_code ON public.profiles(member_code);

-- Create function to generate unique member code
CREATE OR REPLACE FUNCTION public.generate_member_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code (uppercase)
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE member_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Create trigger to auto-generate member code on profile creation
CREATE OR REPLACE FUNCTION public.auto_generate_member_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.member_code IS NULL THEN
    NEW.member_code := public.generate_member_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_generate_member_code ON public.profiles;
CREATE TRIGGER trigger_auto_generate_member_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_member_code();

-- Generate member codes for existing profiles
UPDATE public.profiles 
SET member_code = public.generate_member_code()
WHERE member_code IS NULL;