-- Migration: Add budget column to ministries table for ClergyMarketplace compatibility
ALTER TABLE public.ministries
ADD COLUMN IF NOT EXISTS budget NUMERIC(12,2);

-- Optionally, backfill budget to target_amount for existing rows if needed
UPDATE public.ministries SET budget = target_amount WHERE budget IS NULL;
