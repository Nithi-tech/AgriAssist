-- ============================================================================
-- FIRE STUDIO AGRICULTURAL PLATFORM - IDEMPOTENT DATABASE SETUP
-- Execute this in Supabase SQL Editor for complete schema setup
-- This script is IDEMPOTENT - safe to run multiple times without data loss
-- ============================================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 1: CREATE MARKET PRICES TABLE (IDEMPOTENT)
-- ============================================================================

-- Create market_prices table
CREATE TABLE IF NOT EXISTS market_prices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    market TEXT NOT NULL,
    commodity TEXT NOT NULL,
    variety TEXT,
    unit TEXT DEFAULT 'Quintal',
    min_price NUMERIC(10,2),
    max_price NUMERIC(10,2),
    modal_price NUMERIC(10,2) NOT NULL,
    date DATE NOT NULL,
    source TEXT DEFAULT 'Government API',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'market_prices' AND column_name = 'source') THEN
        ALTER TABLE market_prices ADD COLUMN source TEXT DEFAULT 'Government API';
    END IF;
END $$;

-- Create performance indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_market_prices_state ON market_prices(state);
CREATE INDEX IF NOT EXISTS idx_market_prices_commodity ON market_prices(commodity);
CREATE INDEX IF NOT EXISTS idx_market_prices_date ON market_prices(date DESC);
CREATE INDEX IF NOT EXISTS idx_market_prices_state_commodity ON market_prices(state, commodity);
CREATE INDEX IF NOT EXISTS idx_market_prices_date_commodity ON market_prices(date DESC, commodity);

-- Create unique constraint to prevent duplicates (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idx_market_prices_unique') THEN
        CREATE UNIQUE INDEX idx_market_prices_unique 
        ON market_prices(state, district, market, commodity, COALESCE(variety, ''), date);
    END IF;
END $$;

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_market_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at (drop and recreate to ensure consistency)
DROP TRIGGER IF EXISTS update_market_prices_updated_at_trigger ON market_prices;
CREATE TRIGGER update_market_prices_updated_at_trigger
    BEFORE UPDATE ON market_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_market_prices_updated_at();

-- Enable Row Level Security
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Public read access" ON market_prices;
DROP POLICY IF EXISTS "Admin write access" ON market_prices;
DROP POLICY IF EXISTS "Allow public read access" ON market_prices;
DROP POLICY IF EXISTS "Allow authenticated insert/update" ON market_prices;

-- Create RLS policies
CREATE POLICY "Public read access" ON market_prices
    FOR SELECT USING (true);

CREATE POLICY "Admin write access" ON market_prices
    FOR ALL USING (true);

-- Create materialized view for latest prices (drop and recreate)
DROP MATERIALIZED VIEW IF EXISTS latest_market_prices CASCADE;
CREATE MATERIALIZED VIEW latest_market_prices AS
SELECT DISTINCT ON (state, commodity) 
    id,
    state,
    district,
    market,
    commodity,
    variety,
    unit,
    min_price,
    max_price,
    modal_price,
    date,
    source,
    created_at,
    updated_at
FROM market_prices 
ORDER BY state, commodity, date DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_latest_market_prices_state_commodity 
ON latest_market_prices(state, commodity);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_latest_market_prices()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW latest_market_prices;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 2: CREATE WELFARE SCHEMES TABLE (IDEMPOTENT)
-- ============================================================================

-- Create welfare_schemes table
CREATE TABLE IF NOT EXISTS welfare_schemes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scheme_name TEXT NOT NULL,
    description TEXT,
    eligibility TEXT,
    benefits TEXT,
    how_to_apply TEXT,
    documents_required TEXT,
    implementing_agency TEXT,
    state TEXT,
    category TEXT,
    target_beneficiaries TEXT,
    benefit_amount NUMERIC(12,2),
    launch_year INTEGER,
    official_website TEXT,
    contact_info JSONB,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'welfare_schemes' AND column_name = 'explanation') THEN
        ALTER TABLE welfare_schemes ADD COLUMN explanation TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'welfare_schemes' AND column_name = 'link') THEN
        ALTER TABLE welfare_schemes ADD COLUMN link TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'welfare_schemes' AND column_name = 'updated_at') THEN
        ALTER TABLE welfare_schemes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create performance indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_state ON welfare_schemes(state);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_category ON welfare_schemes(category);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_active ON welfare_schemes(is_active);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_benefit_amount ON welfare_schemes(benefit_amount DESC);

-- Create full-text search index (if not exists)
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_search ON welfare_schemes 
USING gin(to_tsvector('english', 
    COALESCE(scheme_name, '') || ' ' || 
    COALESCE(description, '') || ' ' ||
    COALESCE(eligibility, '') || ' ' ||
    COALESCE(benefits, '')
));

-- Create unique constraint for scheme name per state (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'idx_welfare_schemes_name_state') THEN
        CREATE UNIQUE INDEX idx_welfare_schemes_name_state 
        ON welfare_schemes(scheme_name, COALESCE(state, ''));
    END IF;
END $$;

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_welfare_schemes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    IF TG_TABLE_NAME = 'welfare_schemes' AND OLD.updated_at IS NOT NULL THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating last_updated
DROP TRIGGER IF EXISTS update_welfare_schemes_updated_at_trigger ON welfare_schemes;
CREATE TRIGGER update_welfare_schemes_updated_at_trigger
    BEFORE UPDATE ON welfare_schemes
    FOR EACH ROW
    EXECUTE FUNCTION update_welfare_schemes_updated_at();

-- Enable Row Level Security
ALTER TABLE welfare_schemes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Public read access" ON welfare_schemes;
DROP POLICY IF EXISTS "Admin full access" ON welfare_schemes;

-- Create RLS policies
CREATE POLICY "Public read access" ON welfare_schemes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access" ON welfare_schemes
    FOR ALL USING (true);

-- ============================================================================
-- STEP 3: CREATE USER AUTHENTICATION TABLES (IDEMPOTENT)
-- ============================================================================

-- Create user_profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone_number TEXT UNIQUE,
    location TEXT,
    state TEXT,
    district TEXT,
    farm_size NUMERIC(8,2), -- in acres
    primary_crops TEXT[], -- array of crop names
    farming_experience INTEGER, -- years
    profile_picture_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    user_type TEXT DEFAULT 'farmer' CHECK (user_type IN ('farmer', 'admin', 'agent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create OTP codes table for authentication
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT DEFAULT 'login' CHECK (purpose IN ('login', 'signup', 'reset')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_number ON user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_state ON user_profiles(state);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_expires ON otp_codes(phone_number, expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_used ON otp_codes(expires_at, is_used);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at_trigger ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at_trigger
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can see own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can see all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role access" ON otp_codes;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can see own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can see all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Create RLS policies for otp_codes (server-side only)
CREATE POLICY "Service role access" ON otp_codes
    FOR ALL USING (true);

-- ============================================================================
-- STEP 4: CREATE CROPS MANAGEMENT TABLES (IDEMPOTENT)
-- ============================================================================

-- Create crops table
CREATE TABLE IF NOT EXISTS crops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    variety TEXT,
    planting_date DATE,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    location TEXT,
    state TEXT,
    district TEXT,
    field_name TEXT,
    land_size NUMERIC(8,2), -- in acres
    irrigation_type TEXT CHECK (irrigation_type IN ('rainfed', 'drip', 'sprinkler', 'flood', 'other')),
    soil_type TEXT,
    fertilizer_type TEXT,
    seed_variety TEXT,
    seed_quantity NUMERIC(8,2),
    seed_cost NUMERIC(10,2),
    expected_yield NUMERIC(10,2), -- in quintals
    actual_yield NUMERIC(10,2),
    growth_stage TEXT DEFAULT 'planted' CHECK (growth_stage IN 
        ('planned', 'planted', 'germination', 'vegetative', 'flowering', 'fruiting', 'maturation', 'harvested')),
    health_status TEXT DEFAULT 'healthy' CHECK (health_status IN 
        ('healthy', 'pest_attack', 'disease', 'drought_stress', 'nutrient_deficiency', 'other')),
    investment_amount NUMERIC(12,2),
    revenue_amount NUMERIC(12,2),
    profit_loss NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(revenue_amount, 0) - COALESCE(investment_amount, 0)) STORED,
    notes TEXT,
    weather_dependent BOOLEAN DEFAULT true,
    is_organic BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns that your frontend expects (from existing CREATE_CROPS_TABLE.sql)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'crop_variety') THEN
        ALTER TABLE crops ADD COLUMN crop_variety TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'land_size_unit') THEN
        ALTER TABLE crops ADD COLUMN land_size_unit TEXT DEFAULT 'acre';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'season') THEN
        ALTER TABLE crops ADD COLUMN season VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'farming_method') THEN
        ALTER TABLE crops ADD COLUMN farming_method VARCHAR(30);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'cost_investment') THEN
        ALTER TABLE crops ADD COLUMN cost_investment DECIMAL(12,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'currency') THEN
        ALTER TABLE crops ADD COLUMN currency VARCHAR(10) DEFAULT 'INR';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'status') THEN
        ALTER TABLE crops ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crops' AND column_name = 'created_by') THEN
        ALTER TABLE crops ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create crop logs for tracking activities
CREATE TABLE IF NOT EXISTS crop_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN 
        ('planting', 'watering', 'fertilizing', 'pesticide', 'weeding', 'pruning', 'harvesting', 'observation', 'other')),
    activity_description TEXT NOT NULL,
    activity_date DATE NOT NULL,
    cost NUMERIC(10,2),
    quantity TEXT,
    weather_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON crops(planting_date DESC);
CREATE INDEX IF NOT EXISTS idx_crops_growth_stage ON crops(growth_stage);
CREATE INDEX IF NOT EXISTS idx_crops_state_crop ON crops(state, crop_name);
CREATE INDEX IF NOT EXISTS idx_crops_health_status ON crops(health_status);
CREATE INDEX IF NOT EXISTS idx_crops_crop_name ON crops(crop_name);
CREATE INDEX IF NOT EXISTS idx_crops_location ON crops(location);
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);
CREATE INDEX IF NOT EXISTS idx_crops_updated_at ON crops(updated_at);
CREATE INDEX IF NOT EXISTS idx_crops_created_by ON crops(created_by);
CREATE INDEX IF NOT EXISTS idx_crop_logs_crop_id ON crop_logs(crop_id);
CREATE INDEX IF NOT EXISTS idx_crop_logs_activity_date ON crop_logs(activity_date DESC);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_crops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_crops_updated_at_trigger ON crops;
CREATE TRIGGER update_crops_updated_at_trigger
    BEFORE UPDATE ON crops
    FOR EACH ROW
    EXECUTE FUNCTION update_crops_updated_at();

-- Enable Row Level Security
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Farmers can see own crops" ON crops;
DROP POLICY IF EXISTS "Farmers can manage own crops" ON crops;
DROP POLICY IF EXISTS "Admins can see all crops" ON crops;
DROP POLICY IF EXISTS "Allow public read access to crops" ON crops;
DROP POLICY IF EXISTS "Allow authenticated users to insert crops" ON crops;
DROP POLICY IF EXISTS "Allow users to update their own crops" ON crops;
DROP POLICY IF EXISTS "Allow users to delete their own crops" ON crops;
DROP POLICY IF EXISTS "Farmers can see own crop logs" ON crop_logs;
DROP POLICY IF EXISTS "Farmers can manage own crop logs" ON crop_logs;

-- Create RLS policies for crops (support both farmer_id and created_by patterns)
CREATE POLICY "Farmers can see own crops" ON crops
    FOR SELECT USING (
        auth.uid() = farmer_id OR 
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
    );

CREATE POLICY "Farmers can manage own crops" ON crops
    FOR ALL USING (
        auth.uid() = farmer_id OR 
        auth.uid() = created_by OR
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
    );

CREATE POLICY "Public read access to crops" ON crops
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert crops" ON crops
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for crop_logs
CREATE POLICY "Farmers can see own crop logs" ON crop_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM crops 
            WHERE crops.id = crop_logs.crop_id 
            AND (crops.farmer_id = auth.uid() OR crops.created_by = auth.uid())
        )
    );

CREATE POLICY "Farmers can manage own crop logs" ON crop_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM crops 
            WHERE crops.id = crop_logs.crop_id 
            AND (crops.farmer_id = auth.uid() OR crops.created_by = auth.uid())
        )
    );

-- ============================================================================
-- STEP 5: ADD TABLE COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE market_prices IS 'Daily agricultural market prices from government APIs';
COMMENT ON TABLE welfare_schemes IS 'Government welfare schemes and subsidies for farmers';
COMMENT ON TABLE user_profiles IS 'Extended user profiles for farmers and admins';
COMMENT ON TABLE otp_codes IS 'OTP codes for phone number authentication';
COMMENT ON TABLE crops IS 'Farmer crop tracking and management records';
COMMENT ON TABLE crop_logs IS 'Activity logs for individual crops';

COMMENT ON COLUMN crops.profit_loss IS 'Auto-calculated profit/loss (revenue - investment)';
COMMENT ON COLUMN crops.growth_stage IS 'Current growth stage of the crop';
COMMENT ON COLUMN crops.health_status IS 'Current health condition of the crop';
COMMENT ON COLUMN crops.cost_investment IS 'Total investment amount in the crop';
COMMENT ON COLUMN welfare_schemes.contact_info IS 'JSON object with contact details: phone, email, address';

-- ============================================================================
-- STEP 6: ADD SAMPLE DATA (ONLY IF TABLES ARE EMPTY)
-- ============================================================================

-- Insert sample market prices (only if table is empty)
INSERT INTO market_prices (state, district, market, commodity, variety, min_price, max_price, modal_price, date)
SELECT 'Tamil Nadu', 'Chennai', 'Koyambedu', 'Rice', 'Basmati', 2800.00, 3200.00, 3000.00, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM market_prices LIMIT 1);

INSERT INTO market_prices (state, district, market, commodity, variety, min_price, max_price, modal_price, date)
SELECT 'Tamil Nadu', 'Chennai', 'Koyambedu', 'Wheat', 'Local', 2400.00, 2600.00, 2500.00, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM market_prices WHERE commodity = 'Wheat');

INSERT INTO market_prices (state, district, market, commodity, variety, min_price, max_price, modal_price, date)
SELECT 'Karnataka', 'Bangalore', 'Yeshwantpur', 'Rice', 'Sona Masuri', 2600.00, 2900.00, 2750.00, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM market_prices WHERE state = 'Karnataka');

INSERT INTO market_prices (state, district, market, commodity, variety, min_price, max_price, modal_price, date)
SELECT 'Maharashtra', 'Mumbai', 'Vashi', 'Onion', 'Red', 1200.00, 1500.00, 1350.00, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM market_prices WHERE commodity = 'Onion');

INSERT INTO market_prices (state, district, market, commodity, variety, min_price, max_price, modal_price, date)
SELECT 'Punjab', 'Ludhiana', 'Grain Market', 'Wheat', 'HD-2967', 2300.00, 2500.00, 2400.00, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM market_prices WHERE state = 'Punjab');

-- Insert sample welfare schemes (only if table is empty)
INSERT INTO welfare_schemes (scheme_name, description, eligibility, benefits, state, category, benefit_amount, launch_year)
SELECT 'PM-KISAN', 'Pradhan Mantri Kisan Samman Nidhi - Direct income support to farmers', 'Small and marginal farmers with landholding up to 2 hectares', 'Rs. 6000 per year in three equal installments', 'All India', 'Financial Support', 6000.00, 2019
WHERE NOT EXISTS (SELECT 1 FROM welfare_schemes LIMIT 1);

INSERT INTO welfare_schemes (scheme_name, description, eligibility, benefits, state, category, benefit_amount, launch_year)
SELECT 'Crop Insurance Scheme', 'Pradhan Mantri Fasal Bima Yojana for crop protection', 'All farmers growing notified crops', 'Insurance coverage for crop losses', 'All India', 'Insurance', 50000.00, 2016
WHERE NOT EXISTS (SELECT 1 FROM welfare_schemes WHERE scheme_name = 'Crop Insurance Scheme');

INSERT INTO welfare_schemes (scheme_name, description, eligibility, benefits, state, category, benefit_amount, launch_year)
SELECT 'Soil Health Card', 'Soil testing and nutrient management', 'All farmers', 'Free soil testing and recommendations', 'All India', 'Technical Support', 0.00, 2015
WHERE NOT EXISTS (SELECT 1 FROM welfare_schemes WHERE scheme_name = 'Soil Health Card');

INSERT INTO welfare_schemes (scheme_name, description, eligibility, benefits, state, category, benefit_amount, launch_year)
SELECT 'Kisan Credit Card', 'Credit facility for agricultural needs', 'All farmers', 'Easy credit at subsidized rates', 'All India', 'Credit', 300000.00, 1998
WHERE NOT EXISTS (SELECT 1 FROM welfare_schemes WHERE scheme_name = 'Kisan Credit Card');

INSERT INTO welfare_schemes (scheme_name, description, eligibility, benefits, state, category, benefit_amount, launch_year)
SELECT 'Tamil Nadu Farmers Relief Fund', 'State-specific relief for Tamil Nadu farmers', 'Farmers affected by natural calamities', 'Financial assistance for crop loss', 'Tamil Nadu', 'Relief', 25000.00, 2020
WHERE NOT EXISTS (SELECT 1 FROM welfare_schemes WHERE state = 'Tamil Nadu');

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW latest_market_prices;

-- ============================================================================
-- STEP 7: VERIFY SETUP COMPLETION
-- ============================================================================

-- Show table counts and structure verification
SELECT 'Setup Complete!' as status,
       'All tables, indexes, triggers, and policies created successfully.' as details;

-- Display final table counts
SELECT 'market_prices' as table_name, count(*) as row_count FROM market_prices
UNION ALL
SELECT 'welfare_schemes', count(*) FROM welfare_schemes
UNION ALL  
SELECT 'user_profiles', count(*) FROM user_profiles
UNION ALL
SELECT 'crops', count(*) FROM crops
UNION ALL
SELECT 'crop_logs', count(*) FROM crop_logs
UNION ALL
SELECT 'otp_codes', count(*) FROM otp_codes
UNION ALL
SELECT 'latest_market_prices (materialized view)', count(*) FROM latest_market_prices
ORDER BY table_name;

-- Verify materialized view is working
SELECT 'Materialized View Test' as test,
       COUNT(*) as latest_prices_count,
       MAX(date) as most_recent_date
FROM latest_market_prices;
