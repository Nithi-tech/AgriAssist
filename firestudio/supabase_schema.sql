-- ============================================================================
-- AGRICULTURAL POLICIES TABLE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================================

CREATE TABLE public.agricultural_policies (
  id SERIAL PRIMARY KEY,
  state VARCHAR(50) NOT NULL,
  scheme_name TEXT NOT NULL,
  explanation TEXT,
  eligibility_criteria TEXT,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_policies_state ON public.agricultural_policies (state);
CREATE INDEX idx_policies_scheme_name ON public.agricultural_policies (scheme_name);
CREATE INDEX idx_policies_created_at ON public.agricultural_policies (created_at DESC);

-- Enable Row Level Security (optional, for production)
ALTER TABLE public.agricultural_policies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to authenticated users
CREATE POLICY "Allow read access to all users" ON public.agricultural_policies
  FOR SELECT USING (true);

-- Create policy to allow insert/update for authenticated users
CREATE POLICY "Allow insert for authenticated users" ON public.agricultural_policies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" ON public.agricultural_policies
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON public.agricultural_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table creation
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'agricultural_policies'
ORDER BY ordinal_position;
