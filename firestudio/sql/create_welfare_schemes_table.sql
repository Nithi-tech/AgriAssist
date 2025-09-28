-- Create welfare_schemes table in Supabase
CREATE TABLE welfare_schemes (
  id SERIAL PRIMARY KEY,
  scheme_name VARCHAR(255) NOT NULL,
  state VARCHAR(100) NOT NULL,
  category VARCHAR(100), -- e.g., Agriculture, Education, Health, Housing
  eligibility TEXT NOT NULL,
  benefit_amount VARCHAR(100), -- e.g., "₹5000", "Up to ₹1 lakh", "Variable"
  benefit_type VARCHAR(50), -- e.g., "Direct Transfer", "Subsidy", "Loan", "Equipment"
  link VARCHAR(500),
  explanation TEXT,
  application_process TEXT,
  documents_required TEXT,
  target_beneficiaries VARCHAR(200), -- e.g., "Farmers", "Women", "SC/ST", "BPL families"
  implementing_agency VARCHAR(200),
  launch_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_welfare_schemes_state ON welfare_schemes(state);
CREATE INDEX idx_welfare_schemes_category ON welfare_schemes(category);
CREATE INDEX idx_welfare_schemes_target ON welfare_schemes(target_beneficiaries);
CREATE INDEX idx_welfare_schemes_active ON welfare_schemes(is_active);

-- Create full-text search index for eligibility and explanation
CREATE INDEX idx_welfare_schemes_search ON welfare_schemes 
USING gin(to_tsvector('english', eligibility || ' ' || explanation || ' ' || scheme_name));

-- Enable Row Level Security (RLS)
ALTER TABLE welfare_schemes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed)
CREATE POLICY "Allow public read access" ON welfare_schemes
  FOR SELECT TO public
  USING (is_active = true);

-- Create policy for authenticated insert/update (for admin)
CREATE POLICY "Allow authenticated insert" ON welfare_schemes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON welfare_schemes
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
