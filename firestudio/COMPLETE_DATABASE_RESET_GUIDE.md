# 🗑️ COMPLETE DATABASE RESET & RECREATION GUIDE

## ⚠️ IMPORTANT WARNING
This process will **DELETE ALL DATA** in your Supabase database. Make sure you have backups if needed!

---

## 📋 STEP-BY-STEP PROCESS

### STEP 1: ACCESS SUPABASE DASHBOARD
1. Go to: https://supabase.com/dashboard/project/hreptuxylrsqhqnpfwez
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

---

### STEP 2: DELETE ALL EXISTING DATA & TABLES

Copy and paste this SQL query to delete everything:

```sql
-- ============================================================================
-- STEP 2: DELETE ALL EXISTING DATA AND TABLES
-- ⚠️ WARNING: This will delete ALL your data!
-- ============================================================================

-- Drop all existing tables (if they exist)
DROP TABLE IF EXISTS public.crops CASCADE;
DROP TABLE IF EXISTS public.farmers CASCADE;
DROP TABLE IF EXISTS public.policies CASCADE;
DROP TABLE IF EXISTS public.schemes CASCADE;
DROP TABLE IF EXISTS public.weather_data CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Drop any existing sequences
DROP SEQUENCE IF EXISTS crops_id_seq CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Success message
SELECT 'All existing tables and data deleted successfully!' as result;
```

**Click "RUN" to execute this query.**

---

### STEP 3: CREATE THE UPDATE TIMESTAMP FUNCTION

```sql
-- ============================================================================
-- STEP 3: CREATE UTILITY FUNCTIONS
-- ============================================================================

-- Create function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT 'Utility functions created successfully!' as result;
```

**Click "RUN" to execute this query.**

---

### STEP 4: CREATE THE CROPS TABLE (MAIN TABLE)

This matches your frontend form exactly:

```sql
-- ============================================================================
-- STEP 4: CREATE CROPS TABLE (MAIN TABLE FOR YOUR APPLICATION)
-- ============================================================================

CREATE TABLE public.crops (
    -- Primary key
    id SERIAL PRIMARY KEY,
    
    -- Required fields (NOT NULL)
    crop_name TEXT NOT NULL DEFAULT 'Unknown Crop',
    
    -- Basic crop information
    crop_variety TEXT NULL,
    planting_date DATE NULL,
    expected_harvest_date DATE NULL,
    
    -- Location and size information
    location CHARACTER VARYING(200) NULL,
    land_size NUMERIC(10, 2) NULL,
    land_size_unit CHARACTER VARYING(10) NULL DEFAULT 'acres',
    
    -- Agricultural details
    irrigation_type CHARACTER VARYING(20) NULL,
    soil_type CHARACTER VARYING(50) NULL,
    water_source CHARACTER VARYING(100) NULL,
    fertilizer_used CHARACTER VARYING(200) NULL,
    pesticide_used CHARACTER VARYING(200) NULL,
    
    -- Yield and financial information
    estimated_yield NUMERIC(10, 2) NULL,
    yield_unit CHARACTER VARYING(20) NULL DEFAULT 'kg',
    cost_investment NUMERIC(12, 2) NULL,
    
    -- Status and metadata
    status CHARACTER VARYING(20) NULL DEFAULT 'active',
    season CHARACTER VARYING(20) NULL,
    farming_method CHARACTER VARYING(30) NULL,
    notes TEXT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- User reference
    created_by UUID NULL REFERENCES auth.users(id),
    
    -- Constraints for data validation
    CONSTRAINT crops_status_check CHECK (
        status IN ('active', 'harvested', 'failed', 'planned')
    ),
    
    CONSTRAINT crops_irrigation_type_check CHECK (
        irrigation_type IN ('rainfed', 'drip', 'sprinkler', 'flood', 'tube_well', 'canal', 'other')
    )
);

SELECT 'Crops table created successfully!' as result;
```

**Click "RUN" to execute this query.**

---

### STEP 5: CREATE INDEXES FOR PERFORMANCE

```sql
-- ============================================================================
-- STEP 5: CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Create indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_crops_created_at ON public.crops USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_crops_updated_at ON public.crops USING btree (updated_at);
CREATE INDEX IF NOT EXISTS idx_crops_status ON public.crops USING btree (status);
CREATE INDEX IF NOT EXISTS idx_crops_created_by ON public.crops USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_crops_crop_name ON public.crops USING btree (crop_name);
CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON public.crops USING btree (planting_date DESC);
CREATE INDEX IF NOT EXISTS idx_crops_location ON public.crops USING btree (location);

SELECT 'Database indexes created successfully!' as result;
```

**Click "RUN" to execute this query.**

---

### STEP 6: CREATE AUTO-UPDATE TRIGGER

```sql
-- ============================================================================
-- STEP 6: CREATE TRIGGER FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Create trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_crops_updated_at_trigger ON crops;
CREATE TRIGGER update_crops_updated_at_trigger 
    BEFORE UPDATE ON crops 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'Auto-update trigger created successfully!' as result;
```

**Click "RUN" to execute this query.**

---

### STEP 7: SET UP PERMISSIONS & SECURITY

```sql
-- ============================================================================
-- STEP 7: CONFIGURE PERMISSIONS AND SECURITY
-- ============================================================================

-- Disable RLS temporarily for easier development
ALTER TABLE crops DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service_role (for API access)
GRANT ALL PRIVILEGES ON public.crops TO service_role;
GRANT ALL PRIVILEGES ON public.crops TO authenticated;
GRANT ALL PRIVILEGES ON public.crops TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE crops_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE crops_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE crops_id_seq TO anon;

SELECT 'Permissions configured successfully!' as result;
```

**Click "RUN" to execute this query.**

---

### STEP 8: INSERT SAMPLE DATA (OPTIONAL)

```sql
-- ============================================================================
-- STEP 8: INSERT SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================================================

INSERT INTO public.crops (
    crop_name,
    crop_variety,
    planting_date,
    expected_harvest_date,
    location,
    land_size,
    land_size_unit,
    irrigation_type,
    soil_type,
    water_source,
    fertilizer_used,
    estimated_yield,
    yield_unit,
    cost_investment,
    status,
    season,
    farming_method,
    notes
) VALUES 
(
    'Rice',
    'Basmati',
    '2025-06-01',
    '2025-10-15',
    'Punjab, India',
    5.50,
    'acres',
    'flood',
    'Clay',
    'Canal',
    'NPK Fertilizer',
    3000.00,
    'kg',
    50000.00,
    'active',
    'Kharif',
    'Traditional',
    'First crop of the season'
),
(
    'Wheat',
    'HD-2967',
    '2025-11-15',
    '2026-04-10',
    'Haryana, India',
    3.25,
    'acres',
    'tube_well',
    'Loamy',
    'Tube Well',
    'Urea, DAP',
    2500.00,
    'kg',
    35000.00,
    'planned',
    'Rabi',
    'Modern',
    'Planning for next season'
),
(
    'Tomato',
    'Hybrid',
    '2025-08-01',
    '2025-12-01',
    'Maharashtra, India',
    1.00,
    'acres',
    'drip',
    'Sandy Loam',
    'Borewell',
    'Organic Compost',
    4000.00,
    'kg',
    25000.00,
    'active',
    'Summer',
    'Organic',
    'High yield variety for market'
);

SELECT 'Sample data inserted successfully!' as result;
```

**Click "RUN" to execute this query.**

---

### STEP 9: VERIFY DATABASE SETUP

```sql
-- ============================================================================
-- STEP 9: VERIFY DATABASE SETUP
-- ============================================================================

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'crops' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'crops' 
    AND table_schema = 'public';

-- Check sample data count
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_crops,
    COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned_crops
FROM public.crops;

SELECT 'Database verification completed!' as result;
```

**Click "RUN" to execute this query.**

---

## 🎯 FRONTEND ALIGNMENT VERIFICATION

Your database now perfectly matches these frontend fields:

### ✅ Required Fields (Form Validation)
- `crop_name` ✅ (TEXT NOT NULL)
- `planting_date` ✅ (DATE)
- `location` ✅ (VARCHAR 200)
- `irrigation_type` ✅ (ENUM with validation)
- `land_size` ✅ (NUMERIC 10,2)

### ✅ Optional Fields
- `crop_variety` ✅ (TEXT)
- `expected_harvest_date` ✅ (DATE)
- `soil_type` ✅ (VARCHAR 50)
- `fertilizer_used` ✅ (VARCHAR 200)
- `pesticide_used` ✅ (VARCHAR 200)
- `water_source` ✅ (VARCHAR 100)
- `estimated_yield` ✅ (NUMERIC 10,2)
- `yield_unit` ✅ (VARCHAR 20, default 'kg')
- `land_size_unit` ✅ (VARCHAR 10, default 'acres')
- `notes` ✅ (TEXT)
- `status` ✅ (ENUM, default 'active')
- `season` ✅ (VARCHAR 20)
- `farming_method` ✅ (VARCHAR 30)
- `cost_investment` ✅ (NUMERIC 12,2)

### ✅ Auto-Generated Fields
- `id` ✅ (SERIAL PRIMARY KEY)
- `created_at` ✅ (TIMESTAMP, auto)
- `updated_at` ✅ (TIMESTAMP, auto-update)
- `created_by` ✅ (UUID, references auth.users)

---

## 🚀 FINAL STEPS

### 1. Update Your .env.local File
Make sure your `.env.local` has the correct service role key:
```env
NEXT_PUBLIC_SUPABASE_URL=https://hreptuxylrsqhqnpfwez.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZXB0dXh5bHJzcWhxbnBmd2V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2NDQyMCwiZXhwIjoyMDcwMzQwNDIwfQ.PnycGJ3XMFOGV0CZ7KVojrYPLqkFMlYcQO6TI3iAOTY
```

### 2. Restart Your Development Server
Your server should already be running on http://localhost:9005

### 3. Test Your Application
- Go to http://localhost:9005
- Navigate to the crop management section
- Try adding a new crop
- All fields should work perfectly!

---

## ✅ SUCCESS INDICATORS

After completing all steps, you should have:
- ✅ Clean database with zero old data
- ✅ Perfect schema matching your frontend
- ✅ Proper data validation
- ✅ Auto-updating timestamps
- ✅ Sample data for testing
- ✅ No RLS blocking issues
- ✅ All CRUD operations working

Your database is now perfectly aligned with your frontend requirements! 🎉
