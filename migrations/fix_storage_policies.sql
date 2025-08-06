-- Fix Supabase Storage RLS Policies for Prospectus Generation
-- Run this in Supabase SQL Editor to allow the bulk generation script to upload files

-- First, check current policies on storage.objects
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Drop existing restrictive policies if they exist (optional - only if needed)
-- DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
-- DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow uploads to campaign-media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to campaign-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to campaign-media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from campaign-media bucket" ON storage.objects;

-- Create a permissive policy for campaign-media bucket uploads
-- This allows anyone (including anon users) to upload to the campaign-media bucket
CREATE POLICY "Allow uploads to campaign-media bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'campaign-media');

-- Create a policy for public read access to campaign-media bucket
CREATE POLICY "Public read access to campaign-media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'campaign-media');

-- Create a policy for updating files in campaign-media bucket
CREATE POLICY "Allow updates to campaign-media bucket" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'campaign-media')
WITH CHECK (bucket_id = 'campaign-media');

-- Create a policy for deleting files in campaign-media bucket
CREATE POLICY "Allow deletes from campaign-media bucket" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'campaign-media');

-- Verify the new policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%campaign-media%';

-- Alternative: If you want to be more restrictive, you can create policies that only allow 
-- uploads to the prospectuses folder specifically:
/*
CREATE POLICY IF NOT EXISTS "Allow uploads to prospectuses folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'campaign-media' AND 
  name LIKE 'prospectuses/%'
);
*/
