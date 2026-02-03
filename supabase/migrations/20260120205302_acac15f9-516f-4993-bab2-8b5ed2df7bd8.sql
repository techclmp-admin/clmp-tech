-- 1. Update has_role function to handle new role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 2. Create function to check if user is any type of admin
CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'system_admin')
  )
$$;

-- 3. Create function to check if user is system admin
CREATE OR REPLACE FUNCTION public.is_system_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'system_admin'
  )
$$;

-- 4. Migrate current admin (techclmp@gmail.com) to system_admin
UPDATE public.user_roles 
SET role = 'system_admin' 
WHERE user_id = '3304fa3d-05b3-491f-95a6-72677f8ee4d1' 
  AND role = 'admin';