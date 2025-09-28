-- ============================================================================
-- COMPLETE DATABASE RESET - DELETE ALL DATA
-- Run in Supabase SQL Editor to clean everything
-- WARNING: This will delete ALL your data permanently
-- ============================================================================

-- Drop all existing policies first
DROP POLICY IF EXISTS "Allow public read access" ON market_prices;
DROP POLICY IF EXISTS "Allow authenticated insert/update" ON market_prices;
DROP POLICY IF EXISTS "Public read access" ON welfare_schemes;
DROP POLICY IF EXISTS "Authenticated write access" ON welfare_schemes;
DROP POLICY IF EXISTS "Users can only see their own crops" ON crops;
DROP POLICY IF EXISTS "Users can only update their own crops" ON crops;
DROP POLICY IF EXISTS "Users can see own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS latest_market_prices CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS refresh_latest_market_prices() CASCADE;
DROP FUNCTION IF EXISTS update_market_prices_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_user_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_crops_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_welfare_schemes_updated_at() CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_market_prices_updated_at_trigger ON market_prices;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at_trigger ON user_profiles;
DROP TRIGGER IF EXISTS update_crops_updated_at_trigger ON crops;
DROP TRIGGER IF EXISTS update_welfare_schemes_updated_at_trigger ON welfare_schemes;

-- Drop all tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP TABLE IF EXISTS crop_logs CASCADE;
DROP TABLE IF EXISTS market_price_history CASCADE;
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS crops CASCADE;
DROP TABLE IF EXISTS market_prices CASCADE;
DROP TABLE IF EXISTS welfare_schemes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop any existing indexes that weren't cascade deleted
DROP INDEX IF EXISTS idx_market_prices_state;
DROP INDEX IF EXISTS idx_market_prices_commodity;
DROP INDEX IF EXISTS idx_market_prices_date;
DROP INDEX IF EXISTS idx_market_prices_state_commodity;
DROP INDEX IF EXISTS idx_market_prices_date_desc;
DROP INDEX IF EXISTS idx_market_prices_unique;
DROP INDEX IF EXISTS idx_welfare_schemes_state;
DROP INDEX IF EXISTS idx_welfare_schemes_category;
DROP INDEX IF EXISTS idx_welfare_schemes_search;
DROP INDEX IF EXISTS idx_crops_farmer_id;
DROP INDEX IF EXISTS idx_crops_planting_date;
DROP INDEX IF EXISTS idx_user_profiles_phone_number;
DROP INDEX IF EXISTS idx_otp_codes_phone_expires;

-- Clean up any remaining sequences
DROP SEQUENCE IF EXISTS market_prices_id_seq CASCADE;
DROP SEQUENCE IF EXISTS welfare_schemes_id_seq CASCADE;
DROP SEQUENCE IF EXISTS crops_id_seq CASCADE;

-- Show remaining tables (should be empty except auth tables)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name NOT LIKE 'auth%'
AND table_name NOT LIKE '_auth%'
ORDER BY table_name;
