-- =====================================================
-- STRENGTHEN SERVER-SIDE AUTHORIZATION
-- =====================================================

-- 1. Helper function to check if user is project owner
CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND created_by = _user_id
  );
$$;

-- 2. Helper function to check if user is project admin (owner or has admin role in project)
CREATE OR REPLACE FUNCTION public.is_project_admin(_project_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = _project_id AND created_by = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = _project_id 
    AND user_id = _user_id 
    AND role IN ('admin', 'owner')
  );
$$;

-- 3. Secure function for transferring project ownership
CREATE OR REPLACE FUNCTION public.transfer_project_ownership(
  p_project_id uuid,
  p_new_owner_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_owner_id uuid;
BEGIN
  -- Get current owner
  SELECT created_by INTO current_owner_id FROM public.projects WHERE id = p_project_id;
  
  -- Only current owner can transfer ownership
  IF current_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the project owner can transfer ownership';
  END IF;
  
  -- Verify new owner is a member of the project
  IF NOT EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = p_project_id AND user_id = p_new_owner_id
  ) THEN
    RAISE EXCEPTION 'New owner must be a member of the project';
  END IF;
  
  -- Transfer ownership
  UPDATE public.projects SET created_by = p_new_owner_id WHERE id = p_project_id;
  
  -- Update project_members roles
  UPDATE public.project_members 
  SET role = 'owner' 
  WHERE project_id = p_project_id AND user_id = p_new_owner_id;
  
  UPDATE public.project_members 
  SET role = 'admin' 
  WHERE project_id = p_project_id AND user_id = current_owner_id;
  
  RETURN true;
END;
$$;

-- 4. Secure function for removing project members (with authorization)
CREATE OR REPLACE FUNCTION public.remove_project_member(
  p_project_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  project_owner_id uuid;
BEGIN
  -- Get project owner
  SELECT created_by INTO project_owner_id FROM public.projects WHERE id = p_project_id;
  
  -- Cannot remove the project owner
  IF p_user_id = project_owner_id THEN
    RAISE EXCEPTION 'Cannot remove the project owner. Transfer ownership first.';
  END IF;
  
  -- Only project owner or admin can remove members (or self-removal)
  IF auth.uid() != p_user_id AND NOT is_project_admin(p_project_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only project owners/admins can remove other members';
  END IF;
  
  -- Remove the member
  DELETE FROM public.project_members 
  WHERE project_id = p_project_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$;

-- 5. Secure function for blocking members
CREATE OR REPLACE FUNCTION public.block_project_member(
  p_project_id uuid,
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  project_owner_id uuid;
BEGIN
  -- Get project owner
  SELECT created_by INTO project_owner_id FROM public.projects WHERE id = p_project_id;
  
  -- Cannot block the project owner
  IF p_user_id = project_owner_id THEN
    RAISE EXCEPTION 'Cannot block the project owner';
  END IF;
  
  -- Only project owner or admin can block members
  IF NOT is_project_admin(p_project_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only project owners/admins can block members';
  END IF;
  
  -- Cannot block yourself
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot block yourself';
  END IF;
  
  -- Remove from project members first
  DELETE FROM public.project_members 
  WHERE project_id = p_project_id AND user_id = p_user_id;
  
  -- Add to blocked list
  INSERT INTO public.blocked_members (project_id, user_id, blocked_by, reason)
  VALUES (p_project_id, p_user_id, auth.uid(), p_reason)
  ON CONFLICT (project_id, user_id) DO UPDATE SET
    blocked_by = auth.uid(),
    reason = p_reason,
    blocked_at = now();
  
  RETURN true;
END;
$$;

-- 6. Secure function for unblocking members
CREATE OR REPLACE FUNCTION public.unblock_project_member(
  p_project_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only project owner or admin can unblock members
  IF NOT is_project_admin(p_project_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only project owners/admins can unblock members';
  END IF;
  
  -- Remove from blocked list
  DELETE FROM public.blocked_members 
  WHERE project_id = p_project_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$;

-- 7. Add RLS policies for user_roles table (admin-only modifications)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
EXCEPTION WHEN undefined_object THEN
  NULL;
END;
$$;

-- Enable RLS on user_roles if not already enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid() OR has_admin_role(auth.uid()));

-- Only admins can insert new roles
CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_admin_role(auth.uid()));

-- Only admins can update roles
CREATE POLICY "Admins can update user roles"
ON public.user_roles FOR UPDATE
USING (has_admin_role(auth.uid()));

-- Only admins can delete roles
CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
USING (has_admin_role(auth.uid()));

-- 8. Add RLS policies for blocked_members table
DO $$
BEGIN
  DROP POLICY IF EXISTS "Project admins can view blocked members" ON public.blocked_members;
  DROP POLICY IF EXISTS "Project admins can manage blocked members" ON public.blocked_members;
EXCEPTION WHEN undefined_object THEN
  NULL;
END;
$$;

ALTER TABLE public.blocked_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project admins can view blocked members"
ON public.blocked_members FOR SELECT
USING (is_project_admin(project_id, auth.uid()));

CREATE POLICY "Project admins can manage blocked members"
ON public.blocked_members FOR ALL
USING (is_project_admin(project_id, auth.uid()));

-- 9. Secure function for deleting projects (owner only)
CREATE OR REPLACE FUNCTION public.delete_project(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only project owner can delete
  IF NOT is_project_owner(p_project_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only the project owner can delete this project';
  END IF;
  
  -- Delete related data first (cascade should handle most, but being explicit)
  DELETE FROM public.blocked_members WHERE project_id = p_project_id;
  DELETE FROM public.project_members WHERE project_id = p_project_id;
  DELETE FROM public.projects WHERE id = p_project_id;
  
  RETURN true;
END;
$$;

-- 10. Secure function for updating project member roles
CREATE OR REPLACE FUNCTION public.update_member_role(
  p_project_id uuid,
  p_user_id uuid,
  p_new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  project_owner_id uuid;
BEGIN
  -- Get project owner
  SELECT created_by INTO project_owner_id FROM public.projects WHERE id = p_project_id;
  
  -- Cannot change owner's role directly (use transfer_project_ownership instead)
  IF p_user_id = project_owner_id AND p_new_role != 'owner' THEN
    RAISE EXCEPTION 'Cannot demote project owner. Use transfer ownership instead.';
  END IF;
  
  -- Only project owner or admin can change roles
  IF NOT is_project_admin(p_project_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only project owners/admins can change member roles';
  END IF;
  
  -- Cannot promote to owner (use transfer_project_ownership instead)
  IF p_new_role = 'owner' THEN
    RAISE EXCEPTION 'Use transfer_project_ownership to change project owner';
  END IF;
  
  -- Update the role
  UPDATE public.project_members 
  SET role = p_new_role 
  WHERE project_id = p_project_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$;