-- Create email_campaigns table for bulk email management
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled')),
  recipient_filter JSONB DEFAULT '{}',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create email_campaign_recipients table for tracking individual sends
CREATE TABLE public.email_campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_by ON public.email_campaigns(created_by);
CREATE INDEX idx_email_campaign_recipients_campaign_id ON public.email_campaign_recipients(campaign_id);
CREATE INDEX idx_email_campaign_recipients_status ON public.email_campaign_recipients(status);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_campaigns (admin only)
CREATE POLICY "Admins can view all campaigns"
ON public.email_campaigns FOR SELECT
USING (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins can create campaigns"
ON public.email_campaigns FOR INSERT
WITH CHECK (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins can update campaigns"
ON public.email_campaigns FOR UPDATE
USING (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins can delete campaigns"
ON public.email_campaigns FOR DELETE
USING (public.is_any_admin(auth.uid()));

-- RLS policies for email_campaign_recipients (admin only)
CREATE POLICY "Admins can view all recipients"
ON public.email_campaign_recipients FOR SELECT
USING (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins can manage recipients"
ON public.email_campaign_recipients FOR ALL
USING (public.is_any_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON public.email_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();