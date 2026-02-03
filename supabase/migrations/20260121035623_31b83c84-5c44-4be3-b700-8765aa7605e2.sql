-- Fix the profiles_basic view to use SECURITY INVOKER instead of SECURITY DEFINER
-- This ensures the view respects the RLS policies of the querying user, not the view creator

-- Drop the existing view
DROP VIEW IF EXISTS public.profiles_basic;

-- Recreate with SECURITY INVOKER to respect querying user's RLS
CREATE VIEW public.profiles_basic 
WITH (security_invoker = true)
AS
SELECT 
    id,
    user_id,
    full_name,
    avatar_url,
    member_code
FROM profiles;

-- Grant appropriate permissions
GRANT SELECT ON public.profiles_basic TO authenticated;
GRANT SELECT ON public.profiles_basic TO anon;