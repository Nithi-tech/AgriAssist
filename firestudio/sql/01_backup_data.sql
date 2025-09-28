
-- ============================================================================
-- BACKUP CURRENT DATA (Run in Supabase SQL Editor)
-- Save this output before proceeding with reset
-- ============================================================================

-- Backup welfare_schemes if exists
SELECT 'welfare_schemes_backup' as table_name;
SELECT * FROM welfare_schemes ORDER BY created_at;

-- Backup market_prices if exists  
SELECT 'market_prices_backup' as table_name;
SELECT * FROM market_prices ORDER BY created_at;

-- Backup crops if exists
SELECT 'crops_backup' as table_name; 
SELECT * FROM crops ORDER BY created_at;

-- Backup user_profiles if exists
SELECT 'user_profiles_backup' as table_name;
SELECT * FROM user_profiles ORDER BY created_at;

-- Show all existing tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
