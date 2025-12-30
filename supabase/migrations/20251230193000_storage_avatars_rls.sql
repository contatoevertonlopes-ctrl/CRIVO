-- Storage policies for the `avatars` bucket
-- Fixes: 403 "new row violates row-level security policy" on avatar uploads

-- Ensure the bucket exists (id == name == 'avatars') and is public for simple avatar display.
-- If you prefer private avatars, set public = false and always use signed URLs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- RLS is enabled on storage.objects by default in Supabase projects.
-- Policies below restrict writes to a per-user folder: {auth.uid()}/...

DROP POLICY IF EXISTS "Avatar objects are readable" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Allow reading avatars (public bucket use-case)
CREATE POLICY "Avatar objects are readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload into their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Allow authenticated users to update objects in their own folder
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Allow authenticated users to delete objects in their own folder
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND split_part(name, '/', 1) = auth.uid()::text
);
