-- OTP Authentication System Database Schema
-- Run this in your Supabase SQL editor

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret-key';

-- Users table
CREATE TABLE IF NOT EXISTS auth_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mobile_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    location JSONB, -- {address: "", city: "", state: "", country: "", lat: 0, lng: 0}
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP table for storing active OTPs
CREATE TABLE IF NOT EXISTS auth_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mobile_number VARCHAR(20) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL, -- Hashed OTP for security
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    purpose VARCHAR(20) DEFAULT 'login', -- 'login' or 'signup'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS auth_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL, -- IP or mobile number
    action VARCHAR(50) NOT NULL, -- 'send_otp', 'verify_otp'
    attempts INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE
);

-- User sessions table
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_users_mobile ON auth_users(mobile_number);
CREATE INDEX IF NOT EXISTS idx_auth_otps_mobile ON auth_otps(mobile_number, expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier ON auth_rate_limits(identifier, action, window_start);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token_hash);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_auth_users_updated_at 
    BEFORE UPDATE ON auth_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired OTPs and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void AS $$
BEGIN
    -- Clean expired OTPs
    DELETE FROM auth_otps WHERE expires_at < NOW();
    
    -- Clean expired sessions
    DELETE FROM auth_sessions WHERE expires_at < NOW();
    
    -- Clean old rate limit entries (older than 24 hours)
    DELETE FROM auth_rate_limits WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create indexes for cleanup function
CREATE INDEX IF NOT EXISTS idx_auth_otps_expires ON auth_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);

-- Enable Row Level Security
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON auth_users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON auth_users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON auth_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON auth_users TO anon, authenticated;
GRANT ALL ON auth_otps TO anon, authenticated;
GRANT ALL ON auth_rate_limits TO anon, authenticated;
GRANT ALL ON auth_sessions TO anon, authenticated;

-- Sample data for testing (remove in production)
-- INSERT INTO auth_users (mobile_number, name, location, is_verified) VALUES 
-- ('+1234567890', 'Test User', '{"address": "123 Test St", "city": "Test City", "state": "Test State", "country": "Test Country", "lat": 0, "lng": 0}', true);
