-- Allow members of the same household to read each other's avatars.
-- The path convention is `{userId}/{filename}`, so we join profiles on household_id.

DROP POLICY IF EXISTS "Household members can read member avatars" ON storage.objects;

CREATE POLICY "Household members can read member avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1
    FROM profiles viewer
    JOIN profiles owner_profile ON owner_profile.household_id = viewer.household_id
    WHERE viewer.user_id = auth.uid()
      AND owner_profile.user_id::text = split_part(name, '/', 1)
  )
);
