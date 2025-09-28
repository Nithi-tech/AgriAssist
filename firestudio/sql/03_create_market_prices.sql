-- ============================================================================
-- MARKET PRICES TABLE - COMPLETE SCHEMA
-- Agricultural market prices from government APIs
-- ============================================================================

-- Create market_prices table
CREATE TABLE market_prices (
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
    source TEXT DEFAULT 'Government API',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX idx_market_prices_state ON market_prices(state);
CREATE INDEX idx_market_prices_commodity ON market_prices(commodity);
CREATE INDEX idx_market_prices_date ON market_prices(date DESC);
CREATE INDEX idx_market_prices_state_commodity ON market_prices(state, commodity);
CREATE INDEX idx_market_prices_date_commodity ON market_prices(date DESC, commodity);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX idx_market_prices_unique 
ON market_prices(state, district, market, commodity, COALESCE(variety, ''), date);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_market_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_market_prices_updated_at_trigger
    BEFORE UPDATE ON market_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_market_prices_updated_at();

-- Enable Row Level Security
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read access" ON market_prices
    FOR SELECT USING (true);

CREATE POLICY "Admin write access" ON market_prices
    FOR ALL USING (true);

-- Create materialized view for latest prices
CREATE MATERIALIZED VIEW latest_market_prices AS
SELECT DISTINCT ON (state, commodity) 
    id,
    state,
    district,
    market,
    commodity,
    variety,
    unit,
    min_price,
    max_price,
    modal_price,
    date,
    source,
    created_at,
    updated_at
FROM market_prices 
ORDER BY state, commodity, date DESC;

-- Create index on materialized view
CREATE INDEX idx_latest_market_prices_state_commodity 
ON latest_market_prices(state, commodity);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_latest_market_prices()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW latest_market_prices;
END;
$$ LANGUAGE plpgsql;

-- Add table comment
COMMENT ON TABLE market_prices IS 'Daily agricultural market prices from government APIs';
