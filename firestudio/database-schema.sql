-- ============================================================================
-- CROPS TABLE SCHEMA FOR SUPABASE
-- This schema includes all fields from the Admin Panel form
-- ============================================================================

-- Create the crops table
CREATE TABLE IF NOT EXISTS public.crops (
  -- Primary key
  id BIGSERIAL PRIMARY KEY,
  
  -- Basic Information (from admin form)
  crop_name TEXT NOT NULL DEFAULT 'Unknown Crop',
  crop_variety TEXT,
  planting_date DATE,
  expected_harvest_date DATE,
  
  -- Location & Size
  location TEXT,
  land_size NUMERIC(10, 2),
  land_size_unit TEXT DEFAULT 'hectares' CHECK (land_size_unit IN ('hectares', 'acres', 'square_meters')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'harvested', 'failed')),
  
  -- Farming Details
  soil_type TEXT,
  irrigation_type TEXT, -- Renamed from irrigation_method to match existing interface
  water_source TEXT,
  fertilizer_used TEXT,
  pesticide_used TEXT, -- Renamed from pest_control to match existing interface
  
  -- Additional farming details
  season TEXT,
  farming_method TEXT,
  
  -- Yield & Financial (including both expected and actual)
  estimated_yield NUMERIC(10, 2), -- Renamed from expected_yield to match interface
  yield_unit TEXT DEFAULT 'kg',
  actual_yield NUMERIC(10, 2),
  cost_investment NUMERIC(12, 2), -- Renamed from cost_of_cultivation to match interface
  revenue NUMERIC(12, 2),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crops_updated_at
  BEFORE UPDATE ON public.crops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crops_status ON public.crops(status);
CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON public.crops(planting_date);
CREATE INDEX IF NOT EXISTS idx_crops_updated_at ON public.crops(updated_at);
CREATE INDEX IF NOT EXISTS idx_crops_crop_name ON public.crops(crop_name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allow all operations for now - you can restrict later)
CREATE POLICY "Enable read access for all users" ON public.crops
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.crops
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.crops
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.crops
  FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON public.crops TO anon;
GRANT ALL ON public.crops TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.crops_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.crops_id_seq TO authenticated;

-- Insert some sample data to test
INSERT INTO public.crops (
  crop_name, crop_variety, planting_date, expected_harvest_date, 
  location, land_size, land_size_unit, status, soil_type, 
  irrigation_type, fertilizer_used, pesticide_used, 
  estimated_yield, yield_unit, cost_investment, notes
) VALUES 
(
  'Rice', 'Basmati', '2024-06-15', '2024-10-15',
  'Haryana Field A1', 2.5, 'acres', 'active', 'Clay loam',
  'tube_well', 'Urea 50kg, DAP 30kg', 'Chlorpyrifos 500ml',
  1500, 'kg', 25000, 'Good germination rate. Need to monitor for pests in coming weeks.'
),
(
  'Wheat', 'HD-2967', '2023-11-20', '2024-04-15',
  'Punjab Field B2', 4.0, 'acres', 'harvested', 'Well-drained loamy soil',
  'canal', 'Organic compost 100kg, Vermicompost 50kg', 'Neem oil spray',
  2800, 'kg', 45000, 'Excellent harvest! Organic certification maintained.'
),
(
  'Cotton', 'Bt Cotton', '2024-05-10', '2024-12-10',
  'Gujarat Field C3', 6.5, 'acres', 'active', 'Black cotton soil',
  'drip', 'NPK complex 80kg, Potash 40kg', 'Imidacloprid, Lambda-cyhalothrin',
  8, 'quintals', 85000, 'Plants showing good growth. Drip irrigation system working efficiently.'
);

COMMENT ON TABLE public.crops IS 'Stores crop information from the admin panel';
