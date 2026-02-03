-- Fix the add_project_creator_as_member trigger to avoid duplicate entries
CREATE OR REPLACE FUNCTION public.add_project_creator_as_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if member already exists before inserting
  IF NOT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = NEW.id AND user_id = NEW.created_by
  ) THEN
    -- Insert the project creator as an admin in project_members
    INSERT INTO project_members (
      project_id,
      user_id,
      role,
      joined_at
    ) VALUES (
      NEW.id,
      NEW.created_by,
      'admin',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;