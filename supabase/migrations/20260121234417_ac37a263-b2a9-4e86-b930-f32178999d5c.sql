-- Delete orphan projects (no owner and no members)
DELETE FROM projects 
WHERE owner_id IS NULL 
AND id NOT IN (SELECT DISTINCT project_id FROM project_members WHERE project_id IS NOT NULL);

-- Add NOT NULL constraint to owner_id to prevent orphan projects in the future
-- First, update any remaining NULL owner_ids to be set from the first project member
UPDATE projects p
SET owner_id = (
  SELECT user_id 
  FROM project_members pm 
  WHERE pm.project_id = p.id 
  ORDER BY pm.joined_at ASC 
  LIMIT 1
)
WHERE p.owner_id IS NULL 
AND EXISTS (SELECT 1 FROM project_members WHERE project_id = p.id);

-- Create a trigger to ensure owner is always added as a member when project is created
CREATE OR REPLACE FUNCTION public.ensure_owner_is_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If owner_id is set, ensure they are also a project member with 'owner' role
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner')
    ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'owner';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new projects
DROP TRIGGER IF EXISTS ensure_owner_is_member_trigger ON projects;
CREATE TRIGGER ensure_owner_is_member_trigger
AFTER INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION public.ensure_owner_is_member();