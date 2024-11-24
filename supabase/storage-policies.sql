-- Reset existing policies
DROP POLICY IF EXISTS "Avatar public access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete access" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public access to view avatars
CREATE POLICY "Avatar public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Avatar upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Avatar delete access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);