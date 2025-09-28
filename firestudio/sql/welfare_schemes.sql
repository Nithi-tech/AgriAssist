-- Supabase table creation and upsert example for welfare_schemes

-- Create the welfare_schemes table if it doesn't exist
CREATE TABLE IF NOT EXISTS welfare_schemes (
  id SERIAL PRIMARY KEY,
  scheme_name TEXT NOT NULL,
  state TEXT NOT NULL,
  description_html TEXT,
  description_text TEXT NOT NULL DEFAULT '',
  eligibility_html TEXT,
  eligibility_text TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL,
  source_url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  CONSTRAINT unique_scheme UNIQUE (scheme_name, state, link)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_state ON welfare_schemes(state);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_scheme_name ON welfare_schemes(scheme_name);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_scraped_at ON welfare_schemes(scraped_at DESC);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_welfare_schemes_updated_at ON welfare_schemes;
CREATE TRIGGER update_welfare_schemes_updated_at
  BEFORE UPDATE ON welfare_schemes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Example upsert query (used by the scraper)
-- This will insert new records or update existing ones based on the unique constraint
/*
INSERT INTO welfare_schemes (
  scheme_name, 
  state, 
  description_html, 
  description_text, 
  eligibility_html, 
  eligibility_text, 
  link, 
  source_url, 
  scraped_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9
)
ON CONFLICT (scheme_name, state, link)
DO UPDATE SET
  description_html = EXCLUDED.description_html,
  description_text = EXCLUDED.description_text,
  eligibility_html = EXCLUDED.eligibility_html,
  eligibility_text = EXCLUDED.eligibility_text,
  source_url = EXCLUDED.source_url,
  scraped_at = EXCLUDED.scraped_at,
  updated_at = NOW();
*/

-- Sample queries for analysis
-- 1. Count schemes by state
-- SELECT state, COUNT(*) as scheme_count FROM welfare_schemes GROUP BY state ORDER BY scheme_count DESC;

-- 2. Find recently updated schemes
-- SELECT scheme_name, state, updated_at FROM welfare_schemes ORDER BY updated_at DESC LIMIT 10;

-- 3. Search schemes by keyword
-- SELECT scheme_name, state, description_text FROM welfare_schemes 
-- WHERE description_text ILIKE '%farmer%' OR scheme_name ILIKE '%farmer%';

-- 4. Find central vs state schemes
-- SELECT 
--   CASE WHEN state = 'Central' THEN 'Central' ELSE 'State' END as scheme_type,
--   COUNT(*) as count
-- FROM welfare_schemes GROUP BY scheme_type;
