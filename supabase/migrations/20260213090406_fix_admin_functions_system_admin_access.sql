-- Fix admin_get_orphan_auth_users and admin_delete_orphan_profile to allow
-- system_admin role access. Previously these only checked has_role(uid, 'admin')
-- which is an exact match and rejected system_admin users with "Access denied".

CREATE OR REPLACE FUNCTION public.admin_get_orphan_auth_users()
  RETURNS TABLE(id uuid, email text, created_at timestamp with time zone)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT public.is_any_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT au.id, au.email::TEXT, au.created_at
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = au.id
    WHERE p.id IS NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_orphan_profile(p_profile_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT public.is_any_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    DELETE FROM public.profiles WHERE id = p_profile_id;
END;
$function$;
