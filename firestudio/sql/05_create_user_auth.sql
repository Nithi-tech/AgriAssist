-- ============================================================================
-- USER PROFILES & AUTHENTICATION TABLES
-- User management with OTP authentication
-- ============================================================================

-- Create user_profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
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
CREATE TABLE otp_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT DEFAULT 'login' CHECK (purpose IN ('login', 'signup', 'reset')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX idx_user_profiles_phone_number ON user_profiles(phone_number);
CREATE INDEX idx_user_profiles_state ON user_profiles(state);
CREATE INDEX idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX idx_otp_codes_phone_expires ON otp_codes(phone_number, expires_at);
CREATE INDEX idx_otp_codes_expires_used ON otp_codes(expires_at, is_used);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_user_profiles_updated_at_trigger
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

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

-- Add table comments
COMMENT ON TABLE user_profiles IS 'Extended user profiles for farmers and admins';
COMMENT ON TABLE otp_codes IS 'OTP codes for phone number authentication';
COMMENT ON COLUMN user_profiles.primary_crops IS 'Array of main crops grown by farmer';
COMMENT ON COLUMN otp_codes.attempts IS 'Number of verification attempts for this OTP';
