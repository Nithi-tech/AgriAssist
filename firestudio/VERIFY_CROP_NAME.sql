-- ============================================================================
-- VERIFICATION QUERIES - Run these to check crop_name column status
-- ============================================================================

-- Query 1: Check if crop_name column exists in crops table
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'crops' 
AND column_name = 'crop_name';

-- Query 2: Check all columns in crops table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'crops'
ORDER BY ordinal_position;

-- Query 3: Check constraints on crops table
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.crops'::regclass;

-- Query 4: Test inserting a sample crop record (will rollback)
BEGIN;
INSERT INTO public.crops (
    farmer_id, 
    crop_name, 
    variety, 
    planting_date,
    location,
    state
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- dummy UUID
    'Test Wheat',
    'HD-2967',
    CURRENT_DATE,
    'Test Farm',
    'Punjab'
);
SELECT 'SUCCESS: Can insert crop with crop_name' AS test_result;
ROLLBACK;

-- Query 5: Check indexes on crops table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'crops' 
AND schemaname = 'public'
ORDER BY indexname;
