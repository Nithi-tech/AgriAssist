-- ============================================================================
-- CROPS TABLE TESTING QUERIES
-- ============================================================================

-- 1. INSERT TEST - Check defaults and constraints
INSERT INTO public.crops (
    crop_name,
    crop_variety,
    planting_date,
    expected_harvest_date,
    cost_investment,
    status,
    season,
    farming_method,
    location,
    land_size,
    irrigation_type,
    soil_type,
    water_source,
    estimated_yield,
    notes
) VALUES (
    'Tomatoes',
    'Cherry Tomatoes',
    '2025-03-15',
    '2025-06-15',
    2500.00,
    'active',
    'Spring',
    'Organic',
    'North Field Section A',
    0.5,
    'drip',
    'Loamy',
    'Well water',
    150.00,
    'First planting of the season'
);

-- 2. Check that created_at and updated_at were set automatically
SELECT 
    id,
    crop_name,
    status,
    created_at,
    updated_at,
    (updated_at = created_at) as "timestamps_match_on_insert"
FROM public.crops 
ORDER BY id DESC 
LIMIT 1;

-- 3. UPDATE TEST - Check that trigger updates updated_at
UPDATE public.crops 
SET 
    status = 'harvested',
    estimated_yield = 175.50,
    notes = 'Harvest completed successfully'
WHERE crop_name = 'Tomatoes'
AND id = (SELECT MAX(id) FROM public.crops WHERE crop_name = 'Tomatoes');

-- 4. Verify trigger worked - updated_at should be newer than created_at
SELECT 
    id,
    crop_name,
    status,
    created_at,
    updated_at,
    (updated_at > created_at) as "trigger_worked",
    (updated_at - created_at) as "time_difference"
FROM public.crops 
WHERE crop_name = 'Tomatoes'
ORDER BY id DESC 
LIMIT 1;

-- 5. TEST CONSTRAINTS - These should fail with proper error messages

-- Invalid status (should fail)
-- INSERT INTO public.crops (crop_name, status) VALUES ('Test Crop', 'invalid_status');

-- Invalid irrigation type (should fail)  
-- INSERT INTO public.crops (crop_name, irrigation_type) VALUES ('Test Crop', 'invalid_irrigation');

-- 6. PERFORMANCE TEST - Check index usage
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.crops 
WHERE status = 'active' 
AND created_by IS NOT NULL
ORDER BY planting_date DESC;

-- 7. BULK INSERT TEST - Multiple crops
INSERT INTO public.crops (crop_name, crop_variety, status, irrigation_type, planting_date) VALUES
('Corn', 'Sweet Corn', 'planned', 'sprinkler', '2025-04-01'),
('Wheat', 'Winter Wheat', 'active', 'rainfed', '2025-02-15'),
('Soybeans', 'Organic Soybeans', 'active', 'drip', '2025-03-20'),
('Rice', 'Basmati', 'planned', 'flood', '2025-05-01');

-- 8. QUERY TEST - Common farming queries
-- Active crops by planting date
SELECT 
    crop_name,
    crop_variety,
    planting_date,
    expected_harvest_date,
    status,
    irrigation_type
FROM public.crops 
WHERE status = 'active'
ORDER BY planting_date DESC;

-- Crops by season and method
SELECT 
    season,
    farming_method,
    COUNT(*) as crop_count,
    AVG(cost_investment) as avg_investment,
    SUM(estimated_yield) as total_estimated_yield
FROM public.crops 
WHERE status IN ('active', 'planned')
GROUP BY season, farming_method
ORDER BY crop_count DESC;

-- Investment analysis
SELECT 
    status,
    COUNT(*) as count,
    SUM(cost_investment) as total_investment,
    AVG(cost_investment) as avg_investment,
    SUM(estimated_yield) as total_yield
FROM public.crops 
WHERE cost_investment IS NOT NULL
GROUP BY status
ORDER BY total_investment DESC;

-- 9. CLEANUP (uncomment to remove test data)
-- DELETE FROM public.crops WHERE crop_name IN ('Tomatoes', 'Corn', 'Wheat', 'Soybeans', 'Rice');
