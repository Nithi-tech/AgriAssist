-- ============================================================================
-- TRIGGER VERIFICATION AND SETUP SCRIPT
-- Verify that update_updated_at_trigger is working correctly
-- ============================================================================

-- Check if the trigger function exists
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- Check if the trigger exists on crops table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'crops'
    AND trigger_schema = 'public';

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_crops_updated_at_trigger ON crops;
CREATE TRIGGER update_crops_updated_at_trigger
    BEFORE UPDATE ON crops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Test the trigger functionality
-- Insert a test crop
INSERT INTO crops (crop_name, status, location) 
VALUES ('Test Crop for Trigger', 'active', 'Test Location')
ON CONFLICT DO NOTHING;

-- Get the test crop ID
DO $$
DECLARE
    test_crop_id INTEGER;
    initial_updated_at TIMESTAMP;
    new_updated_at TIMESTAMP;
BEGIN
    -- Get the test crop
    SELECT id, updated_at INTO test_crop_id, initial_updated_at 
    FROM crops 
    WHERE crop_name = 'Test Crop for Trigger' 
    LIMIT 1;
    
    IF test_crop_id IS NOT NULL THEN
        -- Wait a moment to ensure timestamp difference
        PERFORM pg_sleep(1);
        
        -- Update the crop status
        UPDATE crops 
        SET status = 'planned' 
        WHERE id = test_crop_id;
        
        -- Check if updated_at changed
        SELECT updated_at INTO new_updated_at 
        FROM crops 
        WHERE id = test_crop_id;
        
        -- Report results
        IF new_updated_at > initial_updated_at THEN
            RAISE NOTICE 'SUCCESS: Trigger is working! Updated_at changed from % to %', 
                initial_updated_at, new_updated_at;
        ELSE
            RAISE NOTICE 'WARNING: Trigger may not be working. Updated_at remained %', 
                initial_updated_at;
        END IF;
        
        -- Clean up test data
        DELETE FROM crops WHERE id = test_crop_id;
        RAISE NOTICE 'Test crop cleaned up successfully';
    ELSE
        RAISE NOTICE 'Could not create test crop for trigger verification';
    END IF;
END $$;

-- Verify all constraints are in place
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_schema = 'public' 
    AND constraint_name LIKE '%crops%';

-- Display current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'crops' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Success message
SELECT 'Trigger verification completed successfully!' as result;
