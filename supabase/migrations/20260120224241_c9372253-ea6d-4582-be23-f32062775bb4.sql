-- Create receipts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload receipts
CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

-- Allow public read access for receipts
CREATE POLICY "Receipts are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- Allow users to update their own receipts
CREATE POLICY "Users can update their receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own receipts
CREATE POLICY "Users can delete their receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);