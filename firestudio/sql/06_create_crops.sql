-- ============================================================================
-- CROPS MANAGEMENT TABLE
-- Farmer crop tracking and management system
-- ============================================================================

-- Create crops table
CREATE TABLE crops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    variety TEXT,
    planting_date DATE,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    location TEXT,
    state TEXT,
    district TEXT,
    field_name TEXT,
    land_size NUMERIC(8,2), -- in acres
    irrigation_type TEXT CHECK (irrigation_type IN ('rainfed', 'drip', 'sprinkler', 'flood', 'other')),
    soil_type TEXT,
    fertilizer_type TEXT,
    seed_variety TEXT,
    seed_quantity NUMERIC(8,2),
    seed_cost NUMERIC(10,2),
    expected_yield NUMERIC(10,2), -- in quintals
    actual_yield NUMERIC(10,2),
    growth_stage TEXT DEFAULT 'planted' CHECK (growth_stage IN 
        ('planned', 'planted', 'germination', 'vegetative', 'flowering', 'fruiting', 'maturation', 'harvested')),
    health_status TEXT DEFAULT 'healthy' CHECK (health_status IN 
        ('healthy', 'pest_attack', 'disease', 'drought_stress', 'nutrient_deficiency', 'other')),
    investment_amount NUMERIC(12,2),
    revenue_amount NUMERIC(12,2),
    profit_loss NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(revenue_amount, 0) - COALESCE(investment_amount, 0)) STORED,
    notes TEXT,
    weather_dependent BOOLEAN DEFAULT true,
    is_organic BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crop logs for tracking activities
CREATE TABLE crop_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    crop_id UUID NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN 
        ('planting', 'watering', 'fertilizing', 'pesticide', 'weeding', 'pruning', 'harvesting', 'observation', 'other')),
    activity_description TEXT NOT NULL,
    activity_date DATE NOT NULL,
    cost NUMERIC(10,2),
    quantity TEXT,
    weather_conditions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX idx_crops_planting_date ON crops(planting_date DESC);
CREATE INDEX idx_crops_growth_stage ON crops(growth_stage);
CREATE INDEX idx_crops_state_crop ON crops(state, crop_name);
CREATE INDEX idx_crops_health_status ON crops(health_status);
CREATE INDEX idx_crop_logs_crop_id ON crop_logs(crop_id);
CREATE INDEX idx_crop_logs_activity_date ON crop_logs(activity_date DESC);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_crops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_crops_updated_at_trigger
    BEFORE UPDATE ON crops
    FOR EACH ROW
    EXECUTE FUNCTION update_crops_updated_at();

-- Enable Row Level Security
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for crops
CREATE POLICY "Farmers can see own crops" ON crops
    FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can manage own crops" ON crops
    FOR ALL USING (auth.uid() = farmer_id);

CREATE POLICY "Admins can see all crops" ON crops
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Create RLS policies for crop_logs
CREATE POLICY "Farmers can see own crop logs" ON crop_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM crops 
            WHERE crops.id = crop_logs.crop_id 
            AND crops.farmer_id = auth.uid()
        )
    );

CREATE POLICY "Farmers can manage own crop logs" ON crop_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM crops 
            WHERE crops.id = crop_logs.crop_id 
            AND crops.farmer_id = auth.uid()
        )
    );

-- Add table comments
COMMENT ON TABLE crops IS 'Farmer crop tracking and management records';
COMMENT ON TABLE crop_logs IS 'Activity logs for individual crops';
COMMENT ON COLUMN crops.profit_loss IS 'Auto-calculated profit/loss (revenue - investment)';
COMMENT ON COLUMN crops.growth_stage IS 'Current growth stage of the crop';
COMMENT ON COLUMN crops.health_status IS 'Current health condition of the crop';
