-- ============================================================================
-- WELFARE SCHEMES TABLE - COMPLETE SCHEMA
-- Government welfare schemes for farmers
-- ============================================================================

-- Create welfare_schemes table
CREATE TABLE welfare_schemes (
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

-- Create performance indexes
CREATE INDEX idx_welfare_schemes_state ON welfare_schemes(state);
CREATE INDEX idx_welfare_schemes_category ON welfare_schemes(category);
CREATE INDEX idx_welfare_schemes_active ON welfare_schemes(is_active);
CREATE INDEX idx_welfare_schemes_benefit_amount ON welfare_schemes(benefit_amount DESC);

-- Create full-text search index
CREATE INDEX idx_welfare_schemes_search ON welfare_schemes 
USING gin(to_tsvector('english', 
    COALESCE(scheme_name, '') || ' ' || 
    COALESCE(description, '') || ' ' ||
    COALESCE(eligibility, '') || ' ' ||
    COALESCE(benefits, '')
));

-- Create unique constraint for scheme name per state
CREATE UNIQUE INDEX idx_welfare_schemes_name_state 
ON welfare_schemes(scheme_name, COALESCE(state, ''));

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_welfare_schemes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating last_updated
CREATE TRIGGER update_welfare_schemes_updated_at_trigger
    BEFORE UPDATE ON welfare_schemes
    FOR EACH ROW
    EXECUTE FUNCTION update_welfare_schemes_updated_at();

-- Enable Row Level Security
ALTER TABLE welfare_schemes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read access" ON welfare_schemes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access" ON welfare_schemes
    FOR ALL USING (true);

-- Add table comment
COMMENT ON TABLE welfare_schemes IS 'Government welfare schemes and subsidies for farmers';
COMMENT ON COLUMN welfare_schemes.contact_info IS 'JSON object with contact details: phone, email, address';
