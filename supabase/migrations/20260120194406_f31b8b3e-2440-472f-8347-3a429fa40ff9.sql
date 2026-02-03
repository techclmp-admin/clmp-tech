-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;

-- Create simpler, non-recursive policies
-- Users can view events they created
CREATE POLICY "View own created events"
ON public.events
FOR SELECT
USING (auth.uid() = created_by);

-- Users can view public events
CREATE POLICY "View public events"
ON public.events
FOR SELECT
USING (is_public = true);

-- Users can view events for projects they're members of
CREATE POLICY "View project events"
ON public.events
FOR SELECT
USING (
    entity_id IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = events.entity_id 
        AND pm.user_id = auth.uid()
    )
);

-- Users can view events they're participants in
CREATE POLICY "View events as participant"
ON public.events
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.event_participants ep
        WHERE ep.event_id = events.id 
        AND ep.user_id = auth.uid()
    )
);

-- Users can create events
CREATE POLICY "Create own events"
ON public.events
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Users can update their own events
CREATE POLICY "Update own events"
ON public.events
FOR UPDATE
USING (auth.uid() = created_by);

-- Users can delete their own events
CREATE POLICY "Delete own events"
ON public.events
FOR DELETE
USING (auth.uid() = created_by);