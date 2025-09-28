-- ============================================================================
-- AGRICULTURAL MARKET PRICES DATABASE SCHEMA
-- Table for storing daily market price data for agricultural commodities
-- Source: Government APIs (Agmarknet, Data.gov.in, State Marketing Boards)
-- ============================================================================

-- Create market_prices table
CREATE TABLE IF NOT EXISTS market_prices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    market TEXT NOT NULL,
    commodity TEXT NOT NULL,
    variety TEXT,
    unit TEXT DEFAULT 'Quintal',
    min_price NUMERIC(10,2),
    max_price NUMERIC(10,2),
    modal_price NUMERIC(10,2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_market_prices_state ON market_prices(state);
CREATE INDEX IF NOT EXISTS idx_market_prices_commodity ON market_prices(commodity);
CREATE INDEX IF NOT EXISTS idx_market_prices_date ON market_prices(date);
CREATE INDEX IF NOT EXISTS idx_market_prices_state_commodity ON market_prices(state, commodity);
CREATE INDEX IF NOT EXISTS idx_market_prices_date_desc ON market_prices(date DESC);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_prices_unique 
ON market_prices(state, district, market, commodity, variety, date);

-- Enable Row Level Security (RLS)
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY IF NOT EXISTS "Allow public read access" ON market_prices
FOR SELECT USING (true);

-- Create policy for authenticated insert/update (for API updates)
CREATE POLICY IF NOT EXISTS "Allow authenticated insert/update" ON market_prices
FOR ALL USING (true);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_market_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER IF NOT EXISTS update_market_prices_updated_at_trigger
    BEFORE UPDATE ON market_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_market_prices_updated_at();

-- Insert sample data for testing
INSERT INTO market_prices (
    state, district, market, commodity, variety, unit, 
    min_price, max_price, modal_price, date
) VALUES 
    ('Maharashtra', 'Pune', 'Pune Market', 'Onion', 'Red', 'Quintal', 2000.00, 2500.00, 2250.00, CURRENT_DATE),
    ('Maharashtra', 'Mumbai', 'Vashi Market', 'Potato', 'White', 'Quintal', 1800.00, 2200.00, 2000.00, CURRENT_DATE),
    ('Punjab', 'Ludhiana', 'Ludhiana Mandi', 'Wheat', 'HD-2967', 'Quintal', 2800.00, 3200.00, 3000.00, CURRENT_DATE),
    ('West Bengal', 'Kolkata', 'Kolkata Market', 'Rice', 'Basmati', 'Quintal', 4500.00, 5500.00, 5000.00, CURRENT_DATE),
    ('Tamil Nadu', 'Chennai', 'Chennai Market', 'Tomato', 'Hybrid', 'Quintal', 1500.00, 2000.00, 1750.00, CURRENT_DATE),
    ('Karnataka', 'Bangalore', 'KR Market', 'Coconut', 'Tall', 'Thousand Nuts', 8000.00, 12000.00, 10000.00, CURRENT_DATE),
    ('Andhra Pradesh', 'Hyderabad', 'Hyderabad Market', 'Chili', 'Guntur', 'Quintal', 15000.00, 18000.00, 16500.00, CURRENT_DATE),
    ('Gujarat', 'Ahmedabad', 'Ahmedabad APMC', 'Cotton', 'DCH-32', 'Quintal', 5500.00, 6500.00, 6000.00, CURRENT_DATE),
    ('Rajasthan', 'Jaipur', 'Jaipur Mandi', 'Mustard', 'Varuna', 'Quintal', 5000.00, 5800.00, 5400.00, CURRENT_DATE),
    ('Uttar Pradesh', 'Agra', 'Agra Market', 'Sugarcane', 'Co-0238', 'Quintal', 350.00, 400.00, 375.00, CURRENT_DATE)
ON CONFLICT (state, district, market, commodity, variety, date) 
DO UPDATE SET
    min_price = EXCLUDED.min_price,
    max_price = EXCLUDED.max_price,
    modal_price = EXCLUDED.modal_price,
    updated_at = NOW();

-- Create materialized view for latest prices (for better performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS latest_market_prices AS
SELECT DISTINCT ON (state, commodity) 
    *
FROM market_prices 
ORDER BY state, commodity, date DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_latest_market_prices_state_commodity 
ON latest_market_prices(state, commodity);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_latest_market_prices()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW latest_market_prices;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON market_prices TO public;
GRANT SELECT ON latest_market_prices TO public;

COMMENT ON TABLE market_prices IS 'Agricultural market prices data from government sources';
COMMENT ON COLUMN market_prices.state IS 'Indian state name';
COMMENT ON COLUMN market_prices.district IS 'District name';
COMMENT ON COLUMN market_prices.market IS 'Market/Mandi name';
COMMENT ON COLUMN market_prices.commodity IS 'Agricultural commodity name';
COMMENT ON COLUMN market_prices.variety IS 'Commodity variety/grade';
COMMENT ON COLUMN market_prices.unit IS 'Price unit (Quintal, Kg, etc.)';
COMMENT ON COLUMN market_prices.min_price IS 'Minimum price in INR';
COMMENT ON COLUMN market_prices.max_price IS 'Maximum price in INR';
COMMENT ON COLUMN market_prices.modal_price IS 'Modal/Average price in INR';
COMMENT ON COLUMN market_prices.date IS 'Price date';
