-- Create events table for Calendar functionality
CREATE TABLE public.events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    event_type TEXT NOT NULL DEFAULT 'meeting',
    event_status TEXT NOT NULL DEFAULT 'scheduled',
    created_by UUID NOT NULL,
    entity_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    event_data JSONB,
    is_public BOOLEAN DEFAULT false,
    registration_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_participants table for tracking attendees
CREATE TABLE public.event_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_events_entity_id ON public.events(entity_id);
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON public.event_participants(user_id);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
-- Users can view events they created or are participants in or are public
CREATE POLICY "Users can view own events"
ON public.events
FOR SELECT
USING (
    auth.uid() = created_by
    OR is_public = true
    OR EXISTS (
        SELECT 1 FROM public.event_participants ep
        WHERE ep.event_id = events.id AND ep.user_id = auth.uid()
    )
    OR (entity_id IS NOT NULL AND public.is_project_member(entity_id, auth.uid()))
);

-- Users can create events
CREATE POLICY "Users can create events"
ON public.events
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Users can update their own events
CREATE POLICY "Users can update own events"
ON public.events
FOR UPDATE
USING (auth.uid() = created_by);

-- Users can delete their own events
CREATE POLICY "Users can delete own events"
ON public.events
FOR DELETE
USING (auth.uid() = created_by);

-- RLS Policies for event_participants
CREATE POLICY "Users can view event participants"
ON public.event_participants
FOR SELECT
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_participants.event_id AND e.created_by = auth.uid()
    )
);

CREATE POLICY "Event creators can manage participants"
ON public.event_participants
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_participants.event_id AND e.created_by = auth.uid()
    )
);

CREATE POLICY "Users can respond to invitations"
ON public.event_participants
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();