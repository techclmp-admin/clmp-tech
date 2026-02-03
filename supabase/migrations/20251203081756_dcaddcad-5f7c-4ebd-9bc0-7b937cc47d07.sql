-- Set chat-files bucket to private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'chat-files';

-- Drop overly permissive policies that allow any authenticated user to access
DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view chat files" ON storage.objects;

-- Keep the room-specific policies:
-- - "Users can upload files to their chat rooms" (already checks room membership)
-- - "Users can view files in their chat rooms" (already checks room membership)
-- - "Users can delete their own chat files" (owner-based)

-- Note: The existing room-specific policies are correctly configured:
-- They check that (storage.foldername(name))[2] IN (SELECT chat_room_id FROM chat_participants WHERE user_id = auth.uid())
-- This ensures users can only access files in rooms they are members of