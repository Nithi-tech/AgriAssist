-- ============================================================================
-- FINAL CROPS SCHEMA ALIGNMENT FIX
-- This script ensures complete alignment between database and application code
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- First, let's check what columns currently exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'crops' 
ORDER BY ordinal_position;

-- Drop the currency column if it exists (we removed it from the app)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'currency') THEN
        ALTER TABLE crops DROP COLUMN currency;
        RAISE NOTICE 'Dropped currency column from crops table';
    END IF;
END $$;

-- Ensure land_size_unit column exists with correct constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'land_size_unit') THEN
        ALTER TABLE crops ADD COLUMN land_size_unit VARCHAR(10) DEFAULT 'acres';
        RAISE NOTICE 'Added land_size_unit column to crops table';
    END IF;
END $$;

-- Ensure yield_unit column exists with correct constraints  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'yield_unit') THEN
        ALTER TABLE crops ADD COLUMN yield_unit VARCHAR(20) DEFAULT 'kg';
        RAISE NOTICE 'Added yield_unit column to crops table';
    END IF;
END $$;

-- Add check constraints for land_size_unit if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'crops_land_size_unit_check') THEN
        ALTER TABLE crops ADD CONSTRAINT crops_land_size_unit_check 
        CHECK (land_size_unit IN ('acres', 'hectares', 'bigha'));
        RAISE NOTICE 'Added land_size_unit check constraint';
    END IF;
END $$;

-- Add check constraints for yield_unit if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'crops_yield_unit_check') THEN
        ALTER TABLE crops ADD CONSTRAINT crops_yield_unit_check 
        CHECK (yield_unit IN ('kg', 'tons', 'quintals', 'bags'));
        RAISE NOTICE 'Added yield_unit check constraint';
    END IF;
END $$;

-- Update the status check constraint to match our API validation
DO $$
BEGIN
    -- Drop existing status constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'crops_status_check') THEN
        ALTER TABLE crops DROP CONSTRAINT crops_status_check;
        RAISE NOTICE 'Dropped old status check constraint';
    END IF;
    
    -- Add updated status constraint
    ALTER TABLE crops ADD CONSTRAINT crops_status_check 
    CHECK (status IN ('active', 'harvested', 'failed', 'planned'));
    RAISE NOTICE 'Added updated status check constraint';
END $$;

-- Update the irrigation_type check constraint to match our API validation
DO $$
BEGIN
    -- Drop existing irrigation_type constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'crops_irrigation_type_check') THEN
        ALTER TABLE crops DROP CONSTRAINT crops_irrigation_type_check;
        RAISE NOTICE 'Dropped old irrigation_type check constraint';
    END IF;
    
    -- Add updated irrigation_type constraint
    ALTER TABLE crops ADD CONSTRAINT crops_irrigation_type_check 
    CHECK (irrigation_type IN ('rainfed', 'drip', 'sprinkler', 'flood', 'tube_well', 'canal', 'other'));
    RAISE NOTICE 'Added updated irrigation_type check constraint';
END $$;

-- Update any existing NULL values to defaults
UPDATE crops SET land_size_unit = 'acres' WHERE land_size_unit IS NULL;
UPDATE crops SET yield_unit = 'kg' WHERE yield_unit IS NULL;
UPDATE crops SET status = 'active' WHERE status IS NULL;

-- Final verification - show the current schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'crops' 
ORDER BY ordinal_position;

-- Show all constraints
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE 'crops_%';

RAISE NOTICE 'FINAL CROPS SCHEMA FIX COMPLETED SUCCESSFULLY!';
