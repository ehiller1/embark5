-- Migration: Add prospectus columns to ministries table
-- Run this in Supabase SQL Editor to add the missing columns

-- Add prospectus_url column to store the URL of the generated PDF
ALTER TABLE ministries 
ADD COLUMN IF NOT EXISTS prospectus_url TEXT;

-- Add prospectus_generated_at column to track when the prospectus was created
ALTER TABLE ministries 
ADD COLUMN IF NOT EXISTS prospectus_generated_at TIMESTAMPTZ;

-- Add comment to document the columns
COMMENT ON COLUMN ministries.prospectus_url IS 'URL to the stored prospectus PDF in Supabase storage';
COMMENT ON COLUMN ministries.prospectus_generated_at IS 'Timestamp when the prospectus was generated';

-- Optional: Create an index on prospectus_url for faster queries
CREATE INDEX IF NOT EXISTS idx_ministries_prospectus_url ON ministries(prospectus_url);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ministries' 
AND column_name IN ('prospectus_url', 'prospectus_generated_at');
