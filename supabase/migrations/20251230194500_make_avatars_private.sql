-- Make `avatars` bucket private and restrict reads to the owner folder.
-- Requires frontend to store only the object path (e.g. `{userId}/file.jpg`) and generate signed URLs.

-- Ensure bucket exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Replace the public read policy with an owner-only read policy
DROP POLICY IF EXISTS "Avatar objects are readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own avatar" ON storage.objects;

CREATE POLICY "Users can read their own avatar"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);
