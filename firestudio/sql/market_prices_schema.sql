-- Market Prices Table Schema for Supabase
-- Run this in your Supabase SQL editor

-- Create the main market_prices table
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  market TEXT NOT NULL,
  commodity TEXT NOT NULL,
  variety TEXT,
  unit TEXT DEFAULT 'Quintal',
  min_price NUMERIC,
  max_price NUMERIC,
  modal_price NUMERIC,
  date DATE NOT NULL,
  source TEXT DEFAULT 'api', -- 'api', 'scraper', 'manual'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_market_prices_state_commodity_date
  ON market_prices(state, commodity, date DESC);

CREATE INDEX IF NOT EXISTS idx_market_prices_commodity
  ON market_prices(commodity);

CREATE INDEX IF NOT EXISTS idx_market_prices_state
  ON market_prices(state);

CREATE INDEX IF NOT EXISTS idx_market_prices_date
  ON market_prices(date DESC);

-- Create unique constraint to prevent duplicates
ALTER TABLE market_prices 
ADD CONSTRAINT unique_market_price_record 
UNIQUE (state, district, market, commodity, variety, date);

-- Enable Row Level Security (RLS)
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access on market_prices" ON market_prices
  FOR SELECT USING (true);

-- Create policy to allow authenticated insert/update (for API updates)
CREATE POLICY "Allow authenticated insert/update on market_prices" ON market_prices
  FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_market_prices_updated_at
  BEFORE UPDATE ON market_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO market_prices (state, district, market, commodity, variety, min_price, max_price, modal_price, date, source) VALUES
  ('Karnataka', 'Bangalore Rural', 'Bangalore', 'Rice', 'Common', 2000, 2500, 2250, CURRENT_DATE, 'sample'),
  ('Karnataka', 'Mysore', 'Mysore', 'Onion', 'Big', 1500, 2000, 1750, CURRENT_DATE, 'sample'),
  ('Tamil Nadu', 'Chennai', 'Chennai', 'Tomato', 'Local', 800, 1200, 1000, CURRENT_DATE, 'sample'),
  ('Maharashtra', 'Pune', 'Pune', 'Wheat', 'Lokwan', 2200, 2800, 2500, CURRENT_DATE, 'sample'),
  ('Punjab', 'Amritsar', 'Amritsar', 'Rice', 'Basmati', 4000, 5000, 4500, CURRENT_DATE, 'sample')
ON CONFLICT (state, district, market, commodity, variety, date) DO NOTHING;
