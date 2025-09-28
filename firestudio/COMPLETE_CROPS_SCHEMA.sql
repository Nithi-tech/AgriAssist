-- ============================================================================
-- COMPLETE CROPS TABLE SCHEMA UPDATE
-- This SQL will create/update the crops table to match your exact schema
-- ============================================================================

-- Drop existing table if it exists (BE CAREFUL - this will delete data!)
-- Comment out the next line if you want to preserve existing data
-- DROP TABLE IF EXISTS public.crops CASCADE;

-- Create the crops table with your exact schema
CREATE TABLE IF NOT EXISTS public.crops (
  id serial NOT NULL,
  crop_variety text NULL,
  planting_date date NULL,
  expected_harvest_date date NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  cost_investment numeric(12, 2) NULL,
  status character varying(20) NULL DEFAULT 'active'::character varying,
  season character varying(20) NULL,
  farming_method character varying(30) NULL,
  created_by uuid NULL,
  crop_name text NOT NULL DEFAULT 'Unknown Crop'::text,
  location character varying(200) NULL,
  land_size numeric(10, 2) NULL,
  irrigation_type character varying(20) NULL,
  soil_type character varying(50) NULL,
  water_source character varying(100) NULL,
  fertilizer_used character varying(200) NULL,
  pesticide_used character varying(200) NULL,
  estimated_yield numeric(10, 2) NULL,
  notes text NULL,
  land_size_unit character varying(10) NULL DEFAULT 'acres'::character varying,
  yield_unit character varying(20) NULL DEFAULT 'kg'::character varying,
  
  -- Primary key constraint
  CONSTRAINT crops_pkey PRIMARY KEY (id),
  
  -- Foreign key constraint to auth.users
  CONSTRAINT crops_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id),
  
  -- Check constraint for irrigation_type
  CONSTRAINT crops_irrigation_type_check CHECK (
    (irrigation_type)::text = ANY (
      ARRAY[
        'rainfed'::character varying,
        'drip'::character varying,
        'sprinkler'::character varying,
        'flood'::character varying,
        'tube_well'::character varying,
        'canal'::character varying,
        'other'::character varying
      ]::text[]
    )
  ),
  
  -- Check constraint for status
  CONSTRAINT crops_status_check CHECK (
    (status)::text = ANY (
      ARRAY[
        'active'::character varying,
        'harvested'::character varying,
        'failed'::character varying,
        'planned'::character varying
      ]::text[]
    )
  )
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crops_updated_at ON public.crops USING btree (updated_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_crops_created_at ON public.crops USING btree (created_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_crops_status ON public.crops USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_crops_created_by ON public.crops USING btree (created_by) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_crops_crop_name ON public.crops USING btree (crop_name) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_crops_planting_date ON public.crops USING btree (planting_date DESC) TABLESPACE pg_default;

-- Create the update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_crops_updated_at_trigger ON crops;
CREATE TRIGGER update_crops_updated_at_trigger 
  BEFORE UPDATE ON crops 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS temporarily to allow service role access
ALTER TABLE crops DISABLE ROW LEVEL SECURITY;

-- Optional: Enable RLS with proper policies (uncomment if you want RLS)
-- ALTER TABLE crops ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (uncomment if you want to enable RLS)
-- DROP POLICY IF EXISTS "Allow service role full access" ON crops;
-- CREATE POLICY "Allow service role full access" ON crops FOR ALL USING (true);

-- DROP POLICY IF EXISTS "Users can view their own crops" ON crops;
-- CREATE POLICY "Users can view their own crops" ON crops FOR SELECT USING (auth.uid() = created_by);

-- DROP POLICY IF EXISTS "Users can insert their own crops" ON crops;
-- CREATE POLICY "Users can insert their own crops" ON crops FOR INSERT WITH CHECK (auth.uid() = created_by);

-- DROP POLICY IF EXISTS "Users can update their own crops" ON crops;
-- CREATE POLICY "Users can update their own crops" ON crops FOR UPDATE USING (auth.uid() = created_by);

-- DROP POLICY IF EXISTS "Users can delete their own crops" ON crops;
-- CREATE POLICY "Users can delete their own crops" ON crops FOR DELETE USING (auth.uid() = created_by);

-- Grant necessary permissions
GRANT ALL ON public.crops TO service_role;
GRANT ALL ON public.crops TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE crops_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE crops_id_seq TO authenticated;

-- Success message
SELECT 'Crops table schema updated successfully!' as result;
