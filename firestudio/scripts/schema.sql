-- Government Schemes Database Schema
-- Run this in your Supabase SQL Editor to ensure table exists

-- Create the agricultural_policies table
CREATE TABLE IF NOT EXISTS public.agricultural_policies (
  id SERIAL PRIMARY KEY,
  state VARCHAR(50) NOT NULL,
  scheme_name TEXT NOT NULL,
  explanation TEXT,
  eligibility_criteria TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agricultural_policies_state 
ON public.agricultural_policies(state);

CREATE INDEX IF NOT EXISTS idx_agricultural_policies_scheme_name 
ON public.agricultural_policies(scheme_name);

-- Create composite index for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_agricultural_policies_unique 
ON public.agricultural_policies(state, scheme_name);

-- Enable Row Level Security (optional)
ALTER TABLE public.agricultural_policies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all users
CREATE POLICY IF NOT EXISTS "Enable read access for all users" 
ON public.agricultural_policies FOR SELECT 
USING (true);

-- Create policy to allow insert for authenticated users (for admin)
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" 
ON public.agricultural_policies FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.agricultural_policies TO authenticated;
GRANT ALL ON public.agricultural_policies TO anon;
