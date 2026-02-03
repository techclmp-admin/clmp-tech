-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-files', 'project-files', true, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view public project files
CREATE POLICY "Public project files are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files');

-- Policy: Authenticated users can upload files to their projects
CREATE POLICY "Authenticated users can upload project files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-files');

-- Policy: Authenticated users can update their uploaded files
CREATE POLICY "Authenticated users can update project files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-files');

-- Policy: Authenticated users can delete their uploaded files
CREATE POLICY "Authenticated users can delete project files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files');