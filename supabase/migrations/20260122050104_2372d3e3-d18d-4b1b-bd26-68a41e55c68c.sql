-- Add tracking columns to email_campaign_recipients
ALTER TABLE public.email_campaign_recipients
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resend_message_id TEXT,
ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS complained_at TIMESTAMP WITH TIME ZONE;

-- Add tracking columns to email_campaigns for aggregated stats
ALTER TABLE public.email_campaigns
ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounced_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS complained_count INTEGER DEFAULT 0;

-- Create email_events table for detailed event tracking
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.email_campaign_recipients(id) ON DELETE CASCADE,
  resend_message_id TEXT,
  event_type TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained'
  event_data JSONB,
  link_url TEXT, -- For click events
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Policies for email_events (admin only)
CREATE POLICY "Admins can view email events"
ON public.email_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert email events"
ON public.email_events
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON public.email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_recipient_id ON public.email_events(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_events_resend_message_id ON public.email_events(resend_message_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON public.email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_resend_id ON public.email_campaign_recipients(resend_message_id);