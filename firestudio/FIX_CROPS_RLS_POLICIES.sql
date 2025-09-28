-- ============================================================================
-- CROPS TABLE RLS (Row Level Security) FIX
-- This SQL script fixes the RLS policy issues for the crops table
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Step 1: Check if RLS is enabled (for debugging)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'crops';

-- Step 2: Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert their own crops" ON crops;
DROP POLICY IF EXISTS "Users can view their own crops" ON crops;
DROP POLICY IF EXISTS "Users can update their own crops" ON crops;
DROP POLICY IF EXISTS "Users can delete their own crops" ON crops;
DROP POLICY IF EXISTS "Admin can manage all crops" ON crops;
DROP POLICY IF EXISTS "Public read access for crops" ON crops;
DROP POLICY IF EXISTS "Authenticated users can manage crops" ON crops;

-- Step 3: Create comprehensive RLS policies for crops table

-- Policy 1: Allow authenticated users to insert crops (they become the owner)
CREATE POLICY "Authenticated users can insert crops" ON crops
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 2: Allow users to view crops they created
CREATE POLICY "Users can view their own crops" ON crops
    FOR SELECT 
    TO authenticated
    USING (created_by = auth.uid());

-- Policy 3: Allow users to update crops they created
CREATE POLICY "Users can update their own crops" ON crops
    FOR UPDATE 
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Policy 4: Allow users to delete crops they created
CREATE POLICY "Users can delete their own crops" ON crops
    FOR DELETE 
    TO authenticated
    USING (created_by = auth.uid());

-- Policy 5: Allow service role (admin) to manage all crops
CREATE POLICY "Service role can manage all crops" ON crops
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Step 4: Alternative - If you want to disable RLS temporarily for testing
-- (Uncomment the line below if you want to disable RLS completely)
-- ALTER TABLE crops DISABLE ROW LEVEL SECURITY;

-- Step 5: Ensure the created_by column gets populated automatically
-- Create or replace the trigger function to set created_by
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    -- Set created_by to the current user's ID if not already set
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_created_by_trigger ON crops;

-- Create the trigger
CREATE TRIGGER set_created_by_trigger
    BEFORE INSERT ON crops
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();

-- Step 6: Update existing crops to have a valid created_by if NULL
-- (This assigns them to the first user or a system UUID)
DO $$
DECLARE
    first_user_id UUID;
    system_uuid UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Try to get the first user ID
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    -- If no users exist, use system UUID, otherwise use first user
    IF first_user_id IS NULL THEN
        first_user_id := system_uuid;
    END IF;
    
    -- Update crops with NULL created_by
    UPDATE crops 
    SET created_by = first_user_id 
    WHERE created_by IS NULL;
    
    RAISE NOTICE 'Updated % crops with created_by = %', 
        (SELECT COUNT(*) FROM crops WHERE created_by = first_user_id), 
        first_user_id;
END $$;

-- Step 7: Verification queries
SELECT 'RLS Status' as check_type, 
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables 
WHERE tablename = 'crops';

SELECT 'Policy Count' as check_type, 
       COUNT(*)::text as status
FROM pg_policies 
WHERE tablename = 'crops';

SELECT 'Policies List' as check_type, 
       policyname as status
FROM pg_policies 
WHERE tablename = 'crops';

-- ✅ RLS POLICIES SETUP COMPLETE!
-- Your crops table now has proper security policies that allow:
-- 1. Authenticated users to create, read, update, delete their own crops
-- 2. Service role (admin) to manage all crops
-- 3. Automatic assignment of created_by field

RAISE NOTICE 'CROPS RLS POLICIES SETUP COMPLETED SUCCESSFULLY!';
