-- Update can_assign_role_secure to handle bootstrap case
CREATE OR REPLACE FUNCTION public.can_assign_role_secure(assigner_id uuid, target_role_tag text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT CASE 
        WHEN target_role_tag IN ('admin_sysops', 'admin_security') THEN 
            -- Allow admin assignment if:
            -- 1. The assigner is already an admin OR
            -- 2. No admins exist yet (bootstrap case)
            EXISTS (
                SELECT 1
                FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = assigner_id
                AND r.tag IN ('admin_sysops', 'admin_security')
                AND ur.status = 'active'
            ) 
            OR 
            NOT EXISTS (
                SELECT 1
                FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE r.tag IN ('admin_sysops', 'admin_security')
                AND ur.status = 'active'
            )
        ELSE 
            -- Admins can assign non-admin roles
            EXISTS (
                SELECT 1
                FROM public.user_roles ur
                JOIN public.roles r ON ur.role_id = r.id
                WHERE ur.user_id = assigner_id
                AND r.tag IN ('admin_sysops', 'admin_security')
                AND ur.status = 'active'
            )
    END;
$function$;