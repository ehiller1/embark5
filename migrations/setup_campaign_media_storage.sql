-- Setup campaign-media storage bucket policies
-- Run this in Supabase SQL Editor after manually creating the campaign-media bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for campaign media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon uploads to campaign-media" ON storage.objects;

-- Create permissive policies for campaign-media bucket

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'campaign-media' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NULL)
);

-- Allow public read access to campaign media
CREATE POLICY "Public read access for campaign media" ON storage.objects
FOR SELECT USING (bucket_id = 'campaign-media');

-- Allow users to update their own files (and anon for bulk operations)
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'campaign-media' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NULL)
);

-- Allow users to delete their own files (and anon for bulk operations)
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'campaign-media' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NULL)
);

-- Allow anon key to upload files (needed for bulk operations and scripts)
CREATE POLICY "Allow anon uploads to campaign-media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'campaign-media');

-- Ensure bucket policies are enabled
UPDATE storage.buckets 
SET public = true 
WHERE name = 'campaign-media';
