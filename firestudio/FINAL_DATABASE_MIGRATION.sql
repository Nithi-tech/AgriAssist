-- ============================================================================
-- COMPLETE CROPS SCHEMA FIX - RUN THIS IN SUPABASE DASHBOARD
-- This SQL script fixes all schema issues permanently
-- ============================================================================

-- Step 1: Add missing columns that exist in the code but not in database
ALTER TABLE crops ADD COLUMN IF NOT EXISTS land_size_unit VARCHAR(10) DEFAULT 'acres';
ALTER TABLE crops ADD COLUMN IF NOT EXISTS yield_unit VARCHAR(20) DEFAULT 'kg';

-- Step 2: Remove currency column (removed from application code)
ALTER TABLE crops DROP COLUMN IF EXISTS currency;

-- Step 3: Update any existing NULL values to proper defaults
UPDATE crops SET land_size_unit = 'acres' WHERE land_size_unit IS NULL;
UPDATE crops SET yield_unit = 'kg' WHERE yield_unit IS NULL;
UPDATE crops SET status = 'active' WHERE status IS NULL;

-- Step 4: Add data validation constraints to match API validation
-- Drop existing constraints if they exist (to avoid conflicts)
ALTER TABLE crops DROP CONSTRAINT IF EXISTS crops_land_size_unit_check;
ALTER TABLE crops DROP CONSTRAINT IF EXISTS crops_yield_unit_check;
ALTER TABLE crops DROP CONSTRAINT IF EXISTS crops_status_check;
ALTER TABLE crops DROP CONSTRAINT IF EXISTS crops_irrigation_type_check;

-- Add updated constraints that match the API validation
ALTER TABLE crops ADD CONSTRAINT crops_land_size_unit_check 
    CHECK (land_size_unit IN ('acres', 'hectares', 'bigha'));

ALTER TABLE crops ADD CONSTRAINT crops_yield_unit_check 
    CHECK (yield_unit IN ('kg', 'tons', 'quintals', 'bags'));

ALTER TABLE crops ADD CONSTRAINT crops_status_check 
    CHECK (status IN ('active', 'harvested', 'failed', 'planned'));

ALTER TABLE crops ADD CONSTRAINT crops_irrigation_type_check 
    CHECK (irrigation_type IN ('rainfed', 'drip', 'sprinkler', 'flood', 'tube_well', 'canal', 'other'));

-- Step 5: Verification - Show the final schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'crops' 
ORDER BY ordinal_position;

-- ✅ SCHEMA FIX COMPLETE!
-- After running this SQL, restart your Next.js application to clear the schema cache.
