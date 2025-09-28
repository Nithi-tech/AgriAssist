-- ============================================================================
-- COMPREHENSIVE DATABASE SCHEMA FIX
-- This script fixes all database-related problems in the agricultural project
-- Run this in your Supabase Dashboard > SQL Editor
-- Date: August 15, 2025
-- ============================================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- STEP 1: FIX CROPS TABLE - ADD MISSING COLUMNS
-- ============================================================================

-- Check and add missing columns to crops table
DO $$
BEGIN
    -- Add estimated_yield column (referenced in frontend)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'estimated_yield') THEN
        ALTER TABLE crops ADD COLUMN estimated_yield NUMERIC(10,2);
        RAISE NOTICE 'Added estimated_yield column to crops table';
    END IF;

    -- Add yield_unit column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'yield_unit') THEN
        ALTER TABLE crops ADD COLUMN yield_unit VARCHAR(20) DEFAULT 'kg';
        RAISE NOTICE 'Added yield_unit column to crops table';
    END IF;

    -- Add water_source column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'water_source') THEN
        ALTER TABLE crops ADD COLUMN water_source VARCHAR(100);
        RAISE NOTICE 'Added water_source column to crops table';
    END IF;

    -- Add fertilizer_used column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'fertilizer_used') THEN
        ALTER TABLE crops ADD COLUMN fertilizer_used VARCHAR(200);
        RAISE NOTICE 'Added fertilizer_used column to crops table';
    END IF;

    -- Add pesticide_used column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'pesticide_used') THEN
        ALTER TABLE crops ADD COLUMN pesticide_used VARCHAR(200);
        RAISE NOTICE 'Added pesticide_used column to crops table';
    END IF;

    -- Add expected_harvest_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'expected_harvest_date') THEN
        ALTER TABLE crops ADD COLUMN expected_harvest_date DATE;
        RAISE NOTICE 'Added expected_harvest_date column to crops table';
    END IF;

    -- Add soil_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'soil_type') THEN
        ALTER TABLE crops ADD COLUMN soil_type VARCHAR(50);
        RAISE NOTICE 'Added soil_type column to crops table';
    END IF;

    -- Add irrigation_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'irrigation_type') THEN
        ALTER TABLE crops ADD COLUMN irrigation_type VARCHAR(50);
        RAISE NOTICE 'Added irrigation_type column to crops table';
    END IF;

    -- Add land_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'land_size') THEN
        ALTER TABLE crops ADD COLUMN land_size NUMERIC(10,2);
        RAISE NOTICE 'Added land_size column to crops table';
    END IF;

    -- Add land_size_unit column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'land_size_unit') THEN
        ALTER TABLE crops ADD COLUMN land_size_unit VARCHAR(10) DEFAULT 'acres';
        RAISE NOTICE 'Added land_size_unit column to crops table';
    END IF;

    -- Add notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'notes') THEN
        ALTER TABLE crops ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to crops table';
    END IF;

    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'status') THEN
        ALTER TABLE crops ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added status column to crops table';
    END IF;

    -- Ensure growth_stage column exists with proper constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'growth_stage') THEN
        ALTER TABLE crops ADD COLUMN growth_stage TEXT DEFAULT 'planned' CHECK (growth_stage IN 
            ('planned', 'planted', 'germination', 'vegetative', 'flowering', 'fruiting', 'maturation', 'harvested'));
        RAISE NOTICE 'Added growth_stage column to crops table';
    END IF;

    -- Ensure health_status column exists with proper constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'health_status') THEN
        ALTER TABLE crops ADD COLUMN health_status TEXT DEFAULT 'healthy' CHECK (health_status IN 
            ('healthy', 'pest_attack', 'disease', 'drought_stress', 'nutrient_deficiency', 'other'));
        RAISE NOTICE 'Added health_status column to crops table';
    END IF;

    -- Ensure farmer_id column exists (for RLS)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'farmer_id') THEN
        ALTER TABLE crops ADD COLUMN farmer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added farmer_id column to crops table';
    END IF;

    -- Ensure created_by column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'created_by') THEN
        ALTER TABLE crops ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added created_by column to crops table';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: ENSURE ALL REQUIRED INDEXES EXIST
-- ============================================================================

-- Create performance indexes for crops table
CREATE INDEX IF NOT EXISTS idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON crops(planting_date DESC);
CREATE INDEX IF NOT EXISTS idx_crops_growth_stage ON crops(growth_stage);
CREATE INDEX IF NOT EXISTS idx_crops_health_status ON crops(health_status);
CREATE INDEX IF NOT EXISTS idx_crops_crop_name ON crops(crop_name);
CREATE INDEX IF NOT EXISTS idx_crops_location ON crops(location);
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);
CREATE INDEX IF NOT EXISTS idx_crops_estimated_yield ON crops(estimated_yield);
CREATE INDEX IF NOT EXISTS idx_crops_created_at ON crops(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crops_updated_at ON crops(updated_at DESC);

-- ============================================================================
-- STEP 3: ENSURE PROPER TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Create or replace function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for crops table
DROP TRIGGER IF EXISTS update_crops_updated_at_trigger ON crops;
CREATE TRIGGER update_crops_updated_at_trigger
    BEFORE UPDATE ON crops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 4: ENSURE PROPER ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on crops table
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Farmers can see own crops" ON crops;
DROP POLICY IF EXISTS "Farmers can insert own crops" ON crops;
DROP POLICY IF EXISTS "Farmers can update own crops" ON crops;
DROP POLICY IF EXISTS "Farmers can delete own crops" ON crops;
DROP POLICY IF EXISTS "Admin can see all crops" ON crops;

-- Create comprehensive RLS policies
CREATE POLICY "Farmers can see own crops" ON crops
    FOR SELECT USING (
        farmer_id = auth.uid() OR 
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Farmers can insert own crops" ON crops
    FOR INSERT WITH CHECK (
        farmer_id = auth.uid() OR created_by = auth.uid()
    );

CREATE POLICY "Farmers can update own crops" ON crops
    FOR UPDATE USING (
        farmer_id = auth.uid() OR 
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

CREATE POLICY "Farmers can delete own crops" ON crops
    FOR DELETE USING (
        farmer_id = auth.uid() OR 
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- ============================================================================
-- STEP 5: VERIFY AND FIX MARKET_PRICES TABLE
-- ============================================================================

-- Ensure market_prices table has all required columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_prices' AND column_name = 'source') THEN
        ALTER TABLE market_prices ADD COLUMN source TEXT DEFAULT 'Government API';
        RAISE NOTICE 'Added source column to market_prices table';
    END IF;
END $$;

-- ============================================================================
-- STEP 6: VERIFY AND FIX WELFARE_SCHEMES TABLE
-- ============================================================================

-- Ensure welfare_schemes table has all required columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'welfare_schemes' AND column_name = 'explanation') THEN
        ALTER TABLE welfare_schemes ADD COLUMN explanation TEXT;
        RAISE NOTICE 'Added explanation column to welfare_schemes table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'welfare_schemes' AND column_name = 'link') THEN
        ALTER TABLE welfare_schemes ADD COLUMN link TEXT;
        RAISE NOTICE 'Added link column to welfare_schemes table';
    END IF;
END $$;

-- ============================================================================
-- STEP 7: CREATE SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample crop data if crops table is empty (only for testing)
INSERT INTO crops (
    crop_name, 
    variety, 
    planting_date, 
    location, 
    irrigation_type, 
    land_size, 
    land_size_unit,
    estimated_yield,
    yield_unit,
    soil_type,
    growth_stage,
    health_status,
    status,
    farmer_id,
    created_by
)
SELECT 
    'Rice',
    'Basmati',
    CURRENT_DATE - INTERVAL '30 days',
    'Punjab',
    'flood',
    5.0,
    'acres',
    150.0,
    'quintals',
    'alluvial',
    'vegetative',
    'healthy',
    'active',
    auth.uid(),
    auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM crops LIMIT 1)
AND auth.uid() IS NOT NULL;

-- ============================================================================
-- STEP 8: REFRESH SCHEMA CACHE AND VERIFY
-- ============================================================================

-- Refresh materialized views if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'latest_market_prices') THEN
        REFRESH MATERIALIZED VIEW latest_market_prices;
        RAISE NOTICE 'Refreshed latest_market_prices materialized view';
    END IF;
END $$;

-- ============================================================================
-- STEP 9: FINAL VERIFICATION AND SUMMARY
-- ============================================================================

-- Display summary of all tables and their column counts
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('crops', 'market_prices', 'welfare_schemes', 'user_profiles')
GROUP BY table_name
ORDER BY table_name;

-- Display crops table structure for verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'crops' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database schema fix completed successfully!';
    RAISE NOTICE '📊 All missing columns have been added to the crops table';
    RAISE NOTICE '🔒 Row Level Security policies have been updated';
    RAISE NOTICE '⚡ Performance indexes have been created';
    RAISE NOTICE '🔄 Triggers for updated_at columns are in place';
    RAISE NOTICE '🧪 Sample data has been added for testing (if applicable)';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your Fire Studio agricultural platform is now ready!';
    RAISE NOTICE '   - Frontend forms will now work with all database fields';
    RAISE NOTICE '   - API endpoints can save/fetch all crop data correctly';
    RAISE NOTICE '   - estimated_yield, yield_unit, and other missing fields are available';
END $$;
