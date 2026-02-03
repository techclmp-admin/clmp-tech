-- Create contact_requests table for demo booking and contact inquiries
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT,
  request_type TEXT NOT NULL DEFAULT 'demo', -- 'demo' or 'contact'
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'completed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contact requests (public form)
CREATE POLICY "Anyone can submit contact requests"
ON public.contact_requests
FOR INSERT
TO public
WITH CHECK (true);

-- Only authenticated admins can view contact requests
CREATE POLICY "Admins can view contact requests"
ON public.contact_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only authenticated admins can update contact requests
CREATE POLICY "Admins can update contact requests"
ON public.contact_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contact_requests_updated_at
BEFORE UPDATE ON public.contact_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_contact_requests_status ON public.contact_requests(status);
CREATE INDEX idx_contact_requests_created_at ON public.contact_requests(created_at DESC);