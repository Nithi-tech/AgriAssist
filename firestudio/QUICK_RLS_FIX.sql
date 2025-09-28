-- ============================================================================
-- QUICK RLS FIX FOR CROPS TABLE
-- This is a simpler solution that allows your app to work immediately
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Option 1: Temporarily disable RLS for testing (Quick Fix)
ALTER TABLE crops DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS enabled, run this instead:
-- (Comment out the line above and uncomment the section below)

/*
-- Enable RLS
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows service role to do everything
CREATE POLICY "Service role full access" ON crops
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create a policy for authenticated users
CREATE POLICY "Authenticated users can manage crops" ON crops
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Auto-set created_by field
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by = COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_created_by_trigger ON crops;
CREATE TRIGGER set_created_by_trigger
    BEFORE INSERT ON crops
    FOR EACH ROW
    EXECUTE FUNCTION set_created_by();
*/

-- ✅ QUICK FIX APPLIED!
-- Your crops API should now work without RLS errors

SELECT 'Crops RLS Status' as info, 
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables 
WHERE tablename = 'crops';
