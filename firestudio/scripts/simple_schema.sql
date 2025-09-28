-- Simple Database Setup for Government Schemes
-- Run this in your Supabase SQL Editor

-- Drop existing table if needed (optional)
-- DROP TABLE IF EXISTS public.agricultural_policies;

-- Create the agricultural_policies table
CREATE TABLE IF NOT EXISTS public.agricultural_policies (
  id SERIAL PRIMARY KEY,
  state VARCHAR(100) NOT NULL,
  scheme_name TEXT NOT NULL,
  explanation TEXT,
  eligibility_criteria TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agricultural_policies_state 
ON public.agricultural_policies(state);

CREATE INDEX IF NOT EXISTS idx_agricultural_policies_scheme_name 
ON public.agricultural_policies USING gin(to_tsvector('english', scheme_name));

-- Disable Row Level Security temporarily for import
ALTER TABLE public.agricultural_policies DISABLE ROW LEVEL SECURITY;

-- Grant full access to the table
GRANT ALL ON public.agricultural_policies TO anon;
GRANT ALL ON public.agricultural_policies TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE agricultural_policies_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE agricultural_policies_id_seq TO authenticated;

-- Optional: Add some sample data to test
-- INSERT INTO public.agricultural_policies (state, scheme_name, explanation, eligibility_criteria, link) 
-- VALUES ('TEST', 'Test Scheme', 'This is a test scheme', 'All farmers', 'https://example.com');

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'agricultural_policies' 
AND table_schema = 'public';

-- Check if table exists and show sample
SELECT COUNT(*) as total_records FROM public.agricultural_policies;
