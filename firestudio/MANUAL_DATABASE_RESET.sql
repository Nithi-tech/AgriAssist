-- ============================================================================
-- COMPLETE DATABASE RESET FOR FIRE STUDIO AGRICULTURAL PLATFORM
-- Execute this in Supabase SQL Editor for complete database reset
-- WARNING: This will delete ALL your data permanently
-- ============================================================================

-- Step 1: Delete all data from tables (respecting foreign key constraints)
-- Order is important: delete children first, then parents

-- Delete crop activity logs first (child of crops)
TRUNCATE TABLE IF EXISTS crop_logs RESTART IDENTITY CASCADE;

-- Delete crops (child of user_profiles)
TRUNCATE TABLE IF EXISTS crops RESTART IDENTITY CASCADE;

-- Delete OTP codes (independent table)
TRUNCATE TABLE IF EXISTS otp_codes RESTART IDENTITY CASCADE;

-- Delete market prices (independent table)  
TRUNCATE TABLE IF EXISTS market_prices RESTART IDENTITY CASCADE;

-- Delete welfare schemes (independent table)
TRUNCATE TABLE IF EXISTS welfare_schemes RESTART IDENTITY CASCADE;

-- Delete user profiles (but keep auth.users - that's managed by Supabase Auth)
TRUNCATE TABLE IF EXISTS user_profiles RESTART IDENTITY CASCADE;

-- Step 2: Drop existing materialized views and functions
DROP MATERIALIZED VIEW IF EXISTS latest_market_prices CASCADE;
DROP FUNCTION IF EXISTS refresh_latest_market_prices() CASCADE;
DROP FUNCTION IF EXISTS update_market_prices_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_user_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_crops_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_welfare_schemes_updated_at() CASCADE;

-- Step 3: Verify data deletion
SELECT 
    schemaname,
    tablename,
    n_tup_ins as "Total Inserts",
    n_tup_upd as "Total Updates", 
    n_tup_del as "Total Deletes",
    n_live_tup as "Current Rows",
    n_dead_tup as "Dead Rows"
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show remaining tables (should show 0 rows for our tables)
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_name NOT LIKE 'auth_%'
    AND table_name NOT LIKE '_auth_%'
ORDER BY table_name;

-- Success message
SELECT 'Database reset completed successfully! All data deleted but table structure preserved.' as status;
