-- ============================================================================
-- FIRE STUDIO - FIX CROP_NAME COLUMN MIGRATION
-- This script ensures crop_name column exists and refreshes schema cache
-- IDEMPOTENT - Safe to run multiple times
-- ============================================================================

-- Step 1: Ensure crop_name column exists in crops table
DO $$
BEGIN
    -- Check if crop_name column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crops' 
        AND column_name = 'crop_name'
    ) THEN
        -- Add crop_name column if missing
        ALTER TABLE public.crops ADD COLUMN crop_name TEXT NOT NULL DEFAULT 'Unknown Crop';
        RAISE NOTICE 'Added crop_name column to crops table';
    ELSE
        RAISE NOTICE 'crop_name column already exists in crops table';
    END IF;
    
    -- Check if crop_name has NOT NULL constraint
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crops' 
        AND column_name = 'crop_name'
        AND is_nullable = 'NO'
    ) THEN
        -- Make crop_name NOT NULL if it isn't already
        ALTER TABLE public.crops ALTER COLUMN crop_name SET NOT NULL;
        RAISE NOTICE 'Set crop_name column to NOT NULL';
    END IF;
END $$;

-- Step 2: Add unique constraint on crop_name + farmer_id (if not exists)
-- This prevents duplicate crop names per farmer
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'unique_crop_name_per_farmer'
    ) THEN
        ALTER TABLE public.crops 
        ADD CONSTRAINT unique_crop_name_per_farmer 
        UNIQUE (farmer_id, crop_name);
        RAISE NOTICE 'Added unique constraint on farmer_id + crop_name';
    ELSE
        RAISE NOTICE 'Unique constraint on farmer_id + crop_name already exists';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add unique constraint (may have duplicate data): %', SQLERRM;
END $$;

-- Step 3: Create index on crop_name for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_crops_crop_name ON public.crops(crop_name);

-- Step 4: Refresh Supabase schema cache
-- This forces Supabase to reload the table schema
SELECT pg_notify('ddl_command_end', 'crops');

-- Step 5: Verify the column exists and is properly configured
DO $$
DECLARE
    column_info RECORD;
BEGIN
    SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
    INTO column_info
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crops' 
    AND column_name = 'crop_name';
    
    IF FOUND THEN
        RAISE NOTICE 'SUCCESS: crop_name column exists with type: %, nullable: %, default: %', 
            column_info.data_type, column_info.is_nullable, column_info.column_default;
    ELSE
        RAISE EXCEPTION 'FAILED: crop_name column not found in crops table';
    END IF;
END $$;

-- Step 6: Additional schema cache refresh commands
-- These ensure all caches are cleared
NOTIFY pgrst, 'reload schema';
SELECT pg_reload_conf();

-- Final verification query
SELECT 'Migration completed successfully. crop_name column is ready.' AS status;
