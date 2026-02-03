-- Create public assets bucket for email logos and branding
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in assets bucket
CREATE POLICY "Public read access for assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

-- Allow authenticated users to upload to assets bucket (admin only)
CREATE POLICY "Admins can upload assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assets' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update assets
CREATE POLICY "Admins can update assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'assets' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete assets
CREATE POLICY "Admins can delete assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assets' 
  AND public.has_role(auth.uid(), 'admin')
);