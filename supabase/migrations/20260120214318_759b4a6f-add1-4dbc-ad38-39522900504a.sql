-- Create RPC function to get system admin IDs (bypasses RLS for admin use)
CREATE OR REPLACE FUNCTION public.get_system_admin_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY(
    SELECT user_id
    FROM public.user_roles
    WHERE role = 'system_admin'
  );
$$;