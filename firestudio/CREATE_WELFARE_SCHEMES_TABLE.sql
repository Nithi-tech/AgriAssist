-- ============================================================================
-- CREATE WELFARE SCHEMES TABLE - COMPLETE SQL SCRIPT
-- Run this EXACT script in Supabase Dashboard > SQL Editor
-- ============================================================================

-- Drop table if exists (only if you want to start fresh)
-- DROP TABLE IF EXISTS welfare_schemes CASCADE;

-- Create the main table
CREATE TABLE IF NOT EXISTS welfare_schemes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scheme_name TEXT NOT NULL,
  state TEXT NOT NULL,
  eligibility TEXT,
  link TEXT,
  explanation TEXT,
  category TEXT,
  benefit_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional useful columns for your government schemes
  benefit_type TEXT,
  application_process TEXT,
  documents_required TEXT,
  target_beneficiaries TEXT,
  implementing_agency TEXT,
  launch_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_state ON welfare_schemes(state);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_category ON welfare_schemes(category);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_benefit_amount ON welfare_schemes(benefit_amount);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_created_at ON welfare_schemes(created_at);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_active ON welfare_schemes(is_active);

-- Create full-text search index for better search performance
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_search ON welfare_schemes 
USING gin(to_tsvector('english', 
  coalesce(scheme_name,'') || ' ' || 
  coalesce(eligibility,'') || ' ' || 
  coalesce(explanation,'') || ' ' ||
  coalesce(target_beneficiaries,'')
));

-- Enable Row Level Security (RLS)
ALTER TABLE welfare_schemes ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Allow public read access" ON welfare_schemes;
CREATE POLICY "Allow public read access" ON welfare_schemes
  FOR SELECT TO public
  USING (is_active = true);

-- Create policy for authenticated users to insert/update (for admin)
DROP POLICY IF EXISTS "Allow authenticated insert" ON welfare_schemes;
CREATE POLICY "Allow authenticated insert" ON welfare_schemes
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update" ON welfare_schemes;
CREATE POLICY "Allow authenticated update" ON welfare_schemes
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample data for testing
INSERT INTO welfare_schemes (
  scheme_name, state, category, eligibility, benefit_amount, 
  benefit_type, explanation, target_beneficiaries, implementing_agency, launch_year
) VALUES 
(
  'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)', 
  'Central Government', 
  'Agriculture', 
  'Small and marginal farmers with landholding up to 2 hectares', 
  6000, 
  'Direct Transfer',
  'Financial assistance of ₹6000 per year in three equal installments to support farmers',
  'Small and marginal farmers',
  'Ministry of Agriculture & Farmers Welfare',
  2019
),
(
  'Ayushman Bharat - PMJAY', 
  'Central Government', 
  'Health', 
  'Families listed in SECC 2011 database and meeting deprivation criteria', 
  500000, 
  'Health Insurance',
  'Free healthcare coverage up to ₹5 lakh per family per year for secondary and tertiary care',
  'Poor and vulnerable families',
  'National Health Authority',
  2018
),
(
  'PMAY-G (Pradhan Mantri Awaas Yojana - Gramin)', 
  'Central Government', 
  'Housing', 
  'Homeless and families living in kutcha houses in rural areas', 
  120000, 
  'Construction Grant',
  'Financial assistance for construction of pucca houses in rural areas',
  'Rural homeless families',
  'Ministry of Rural Development',
  2016
),
(
  'Tamil Nadu Amma Canteen Scheme', 
  'Tamil Nadu', 
  'Food Security', 
  'All citizens, especially targeting urban poor and working class', 
  5, 
  'Subsidized Food',
  'Subsidized meals available at ₹5 for breakfast, ₹10 for lunch/dinner',
  'Urban poor and working class',
  'Government of Tamil Nadu',
  2013
),
(
  'Chief Minister Relief Fund - Assam', 
  'Assam', 
  'Emergency Relief', 
  'Citizens affected by natural disasters, medical emergencies', 
  0, 
  'Emergency Aid',
  'Financial assistance during emergencies, natural disasters, and medical crises',
  'Disaster-affected citizens',
  'Government of Assam',
  1985
);

-- Refresh the schema cache to make the table immediately available
SELECT pg_notify('pgrst', 'reload schema');

-- ============================================================================
-- VERIFICATION QUERIES - Run these to confirm everything worked
-- ============================================================================

-- Check if table was created successfully
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'welfare_schemes' 
ORDER BY ordinal_position;

-- Check if data was inserted
SELECT COUNT(*) as total_schemes FROM welfare_schemes;

-- Check sample data
SELECT scheme_name, state, category, benefit_amount FROM welfare_schemes LIMIT 3;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS: welfare_schemes table created successfully!';
  RAISE NOTICE '✅ Sample data inserted: 5 schemes added';
  RAISE NOTICE '✅ Indexes created for performance optimization';
  RAISE NOTICE '✅ RLS policies configured for security';
  RAISE NOTICE '✅ Schema cache refreshed';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '1. Set up your .env.local file with Supabase credentials';
  RAISE NOTICE '2. Test the connection in your Next.js app';
  RAISE NOTICE '3. Import more data using CSV or the import script';
END $$;
