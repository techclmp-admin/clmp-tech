-- Drop all problematic policies that cause recursion
DROP POLICY IF EXISTS "View events as participant" ON public.events;
DROP POLICY IF EXISTS "View project events" ON public.events;
DROP POLICY IF EXISTS "Users can view event participants" ON public.event_participants;
DROP POLICY IF EXISTS "Event creators can manage participants" ON public.event_participants;

-- Create a security definer function to check event ownership
CREATE OR REPLACE FUNCTION public.is_event_creator(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events
    WHERE id = _event_id
      AND created_by = _user_id
  )
$$;

-- Create a security definer function to check event participation
CREATE OR REPLACE FUNCTION public.is_event_participant(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_participants
    WHERE event_id = _event_id
      AND user_id = _user_id
  )
$$;

-- Recreate events policies using security definer functions
CREATE POLICY "View events as participant"
ON public.events
FOR SELECT
USING (public.is_event_participant(id, auth.uid()));

CREATE POLICY "View project events"
ON public.events
FOR SELECT
USING (
    entity_id IS NOT NULL 
    AND public.is_project_member(entity_id, auth.uid())
);

-- Recreate event_participants policies using security definer functions
CREATE POLICY "Users can view event participants"
ON public.event_participants
FOR SELECT
USING (
    auth.uid() = user_id 
    OR public.is_event_creator(event_id, auth.uid())
);

CREATE POLICY "Event creators can manage participants"
ON public.event_participants
FOR ALL
USING (public.is_event_creator(event_id, auth.uid()));