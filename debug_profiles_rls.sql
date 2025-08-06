-- Debug script to check profiles table RLS policies and constraints
-- Run this in your Supabase SQL editor to diagnose the preferred_name issue

-- 1. Check if RLS is enabled on profiles table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Check all RLS policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Check table structure and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 4. Check for any triggers on the profiles table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 5. Test insert with preferred_name to see if it works manually
-- (Replace 'test-user-id' with a real UUID)
-- INSERT INTO profiles (id, email, preferred_name, first_name, last_name) 
-- VALUES ('test-user-id', 'test@example.com', 'Test Preferred', 'Test', 'User');

-- 6. Check current profiles data structure
SELECT 
    id,
    email,
    first_name,
    last_name,
    preferred_name,
    church_name,
    role,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Check if there are any check constraints that might be failing
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;
