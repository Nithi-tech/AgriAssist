-- ============================================================================
-- CROP MANAGEMENT DATABASE SCHEMA
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Create the crops table
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(100) NOT NULL,
    planting_date DATE NOT NULL,
    location VARCHAR(200) NOT NULL,
    irrigation_type VARCHAR(50) NOT NULL,
    land_size DECIMAL(10,2) NOT NULL, -- in acres or hectares
    land_size_unit VARCHAR(10) DEFAULT 'acres', -- 'acres' or 'hectares'
    crop_variety VARCHAR(100),
    expected_harvest_date DATE,
    soil_type VARCHAR(50),
    fertilizer_used VARCHAR(200),
    pesticide_used VARCHAR(200),
    water_source VARCHAR(100),
    estimated_yield DECIMAL(10,2),
    yield_unit VARCHAR(20), -- 'kg', 'tons', 'quintals', etc.
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'harvested', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Additional useful fields
    season VARCHAR(20), -- 'kharif', 'rabi', 'zaid'
    farming_method VARCHAR(30), -- 'organic', 'conventional', 'hydroponic'
    cost_investment DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'INR'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON public.crops(planting_date);
CREATE INDEX IF NOT EXISTS idx_crops_crop_name ON public.crops(crop_name);
CREATE INDEX IF NOT EXISTS idx_crops_location ON public.crops(location);
CREATE INDEX IF NOT EXISTS idx_crops_status ON public.crops(status);
CREATE INDEX IF NOT EXISTS idx_crops_updated_at ON public.crops(updated_at);
CREATE INDEX IF NOT EXISTS idx_crops_created_by ON public.crops(created_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_crops_updated_at ON public.crops;
CREATE TRIGGER update_crops_updated_at
    BEFORE UPDATE ON public.crops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow public read access to crops" ON public.crops;
DROP POLICY IF EXISTS "Allow authenticated users to insert crops" ON public.crops;
DROP POLICY IF EXISTS "Allow users to update their own crops" ON public.crops;

-- Allow public read access (you can modify this based on your security needs)
CREATE POLICY "Allow public read access to crops" ON public.crops
    FOR SELECT TO public
    USING (true);

-- Allow authenticated users to insert crops
CREATE POLICY "Allow authenticated users to insert crops" ON public.crops
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow users to update their own crops (optional - if you have user authentication)
CREATE POLICY "Allow users to update their own crops" ON public.crops
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own crops (optional)
CREATE POLICY "Allow users to delete their own crops" ON public.crops
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- Insert sample data for testing
INSERT INTO public.crops (
    crop_name, planting_date, location, irrigation_type, land_size, land_size_unit,
    crop_variety, soil_type, season, farming_method, status, notes
) VALUES 
    ('Rice', '2024-06-15', 'Field A, Farm 1', 'Flood Irrigation', 2.5, 'acres', 
     'Basmati 1121', 'Clay Loam', 'kharif', 'conventional', 'active', 'First crop of the season'),
    ('Wheat', '2024-11-10', 'Field B, Farm 1', 'Sprinkler', 3.0, 'acres',
     'HD-2967', 'Sandy Loam', 'rabi', 'organic', 'active', 'Using organic fertilizers'),
    ('Tomato', '2024-03-20', 'Greenhouse 1', 'Drip Irrigation', 0.5, 'acres',
     'Hybrid Variety', 'Potting Mix', 'zaid', 'hydroponic', 'harvested', 'Excellent yield achieved')
ON CONFLICT (id) DO NOTHING;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT 'Crops table created successfully!' as message, COUNT(*) as sample_records FROM public.crops;
