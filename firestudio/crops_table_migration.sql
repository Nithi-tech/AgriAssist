-- ============================================================================
-- CROPS TABLE COMPLETE MIGRATION SCRIPT
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- 1. Create the trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix timestamp columns to use timestamptz consistently (Supabase best practice)
DO $$
BEGIN
    -- Check if created_at needs to be changed to timestamptz
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crops' 
        AND column_name = 'created_at' 
        AND data_type = 'timestamp without time zone'
    ) THEN
        ALTER TABLE public.crops 
        ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
    END IF;

    -- Ensure updated_at is timestamptz (should already be, but making sure)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crops' 
        AND column_name = 'updated_at' 
        AND data_type != 'timestamp with time zone'
    ) THEN
        ALTER TABLE public.crops 
        ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
    END IF;
END $$;

-- 3. Ensure default values are correct
ALTER TABLE public.crops 
ALTER COLUMN created_at SET DEFAULT NOW(),
ALTER COLUMN updated_at SET DEFAULT NOW();

-- 4. Drop existing trigger if it exists and recreate properly
DROP TRIGGER IF EXISTS update_crops_updated_at_trigger ON public.crops;

CREATE TRIGGER update_crops_updated_at_trigger
    BEFORE UPDATE ON public.crops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Ensure all constraints exist (idempotent)
DO $$
BEGIN
    -- Status constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'crops_status_check'
    ) THEN
        ALTER TABLE public.crops 
        ADD CONSTRAINT crops_status_check 
        CHECK (status IN ('active', 'harvested', 'failed', 'planned'));
    END IF;

    -- Irrigation type constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'crops_irrigation_type_check'
    ) THEN
        ALTER TABLE public.crops 
        ADD CONSTRAINT crops_irrigation_type_check 
        CHECK (irrigation_type IN ('rainfed', 'drip', 'sprinkler', 'flood', 'tube_well', 'canal', 'other'));
    END IF;

    -- Foreign key constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'crops_created_by_fkey'
    ) THEN
        ALTER TABLE public.crops 
        ADD CONSTRAINT crops_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users (id);
    END IF;
END $$;

-- 6. Create optimized indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_crops_status ON public.crops (status);
CREATE INDEX IF NOT EXISTS idx_crops_created_by ON public.crops (created_by);
CREATE INDEX IF NOT EXISTS idx_crops_crop_name ON public.crops (crop_name);
CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON public.crops (planting_date DESC);
CREATE INDEX IF NOT EXISTS idx_crops_created_at ON public.crops (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crops_updated_at ON public.crops (updated_at DESC);

-- 7. Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_crops_status_created_by ON public.crops (status, created_by);
CREATE INDEX IF NOT EXISTS idx_crops_active_planting_date ON public.crops (planting_date DESC) 
WHERE status = 'active';

-- 8. Refresh schema cache for Supabase
SELECT pg_reload_conf();

-- 9. Analyze table for better query planning
ANALYZE public.crops;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check column types
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'crops' 
ORDER BY ordinal_position;

-- Check constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'crops';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'crops';

-- Check trigger
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'crops';
