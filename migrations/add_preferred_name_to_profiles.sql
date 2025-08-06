-- Migration to add preferred_name column to profiles table
-- This fixes the issue where preferred_name is not populating in the database

-- Add preferred_name column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_name TEXT;

-- Add first_name and last_name columns if they don't exist (your code references these too)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add email column if it doesn't exist (your code references this too)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add role column if it doesn't exist (your code references this too)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role TEXT;

-- Add church_id column if it doesn't exist (your code references this too)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);

-- Add created_at and updated_at columns for better data management
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and create it
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the new schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
