-- ============================================================================
-- SEED SAMPLE DATA FOR TESTING
-- Insert minimal sample entries for all tables
-- ============================================================================

-- Insert sample market prices
INSERT INTO market_prices (
    state, district, market, commodity, variety, unit, 
    min_price, max_price, modal_price, date, source
) VALUES 
    ('Maharashtra', 'Pune', 'Pune Mandi', 'Onion', 'Red', 'Quintal', 2000.00, 2500.00, 2250.00, CURRENT_DATE, 'Agmarknet'),
    ('Maharashtra', 'Pune', 'Pune Mandi', 'Tomato', 'Hybrid', 'Quintal', 1800.00, 2200.00, 2000.00, CURRENT_DATE, 'Agmarknet'),
    ('Uttar Pradesh', 'Agra', 'Agra Mandi', 'Sugarcane', 'Co-0238', 'Quintal', 350.00, 400.00, 375.00, CURRENT_DATE, 'Government API'),
    ('Punjab', 'Ludhiana', 'Ludhiana Grain Market', 'Wheat', 'PBW-343', 'Quintal', 2100.00, 2300.00, 2200.00, CURRENT_DATE, 'Data.gov.in'),
    ('Karnataka', 'Bangalore', 'Bangalore Mandi', 'Rice', 'Basmati', 'Quintal', 4500.00, 5000.00, 4750.00, CURRENT_DATE, 'State Board'),
    ('Tamil Nadu', 'Chennai', 'Chennai Market', 'Coconut', 'Tall Variety', 'Per 100', 8000.00, 9000.00, 8500.00, CURRENT_DATE, 'Government API'),
    ('Gujarat', 'Ahmedabad', 'Ahmedabad APMC', 'Cotton', 'Bt Cotton', 'Quintal', 5500.00, 6000.00, 5750.00, CURRENT_DATE, 'APMC'),
    ('Rajasthan', 'Jaipur', 'Jaipur Mandi', 'Mustard', 'Varuna', 'Quintal', 4200.00, 4600.00, 4400.00, CURRENT_DATE, 'Agmarknet'),
    
    -- Previous day data for trend analysis
    ('Maharashtra', 'Pune', 'Pune Mandi', 'Onion', 'Red', 'Quintal', 1900.00, 2400.00, 2150.00, CURRENT_DATE - INTERVAL '1 day', 'Agmarknet'),
    ('Punjab', 'Ludhiana', 'Ludhiana Grain Market', 'Wheat', 'PBW-343', 'Quintal', 2050.00, 2250.00, 2150.00, CURRENT_DATE - INTERVAL '1 day', 'Data.gov.in')

ON CONFLICT (state, district, market, commodity, COALESCE(variety, ''), date) 
DO UPDATE SET
    min_price = EXCLUDED.min_price,
    max_price = EXCLUDED.max_price,
    modal_price = EXCLUDED.modal_price,
    updated_at = NOW();

-- Refresh materialized view
SELECT refresh_latest_market_prices();

-- Insert sample welfare schemes
INSERT INTO welfare_schemes (
    scheme_name, description, eligibility, benefits, how_to_apply,
    documents_required, implementing_agency, state, category,
    target_beneficiaries, benefit_amount, launch_year, official_website,
    contact_info, is_active
) VALUES 
    (
        'Pradhan Mantri Kisan Samman Nidhi',
        'Direct income support to farmers providing Rs. 6000 per year in three installments',
        'Small and marginal farmers with cultivable land up to 2 hectares',
        'Rs. 6000 per year in three equal installments of Rs. 2000 each',
        'Apply through Common Service Centers or agriculture offices',
        'Land records, Aadhaar Card, Bank Account details',
        'Ministry of Agriculture & Farmers Welfare',
        'All India',
        'Direct Benefit Transfer',
        'Small and marginal farmers',
        6000.00,
        2019,
        'https://www.pmkisan.gov.in/',
        '{"phone": "011-23381092", "email": "pmkisan-ict@gov.in", "helpline": "155261"}',
        true
    ),
    (
        'Kisan Credit Card Scheme',
        'Credit facility for farmers to meet production credit requirements',
        'All farmers including tenant farmers, oral lessees, and sharecroppers',
        'Credit up to Rs. 3 lakh at subsidized interest rates',
        'Apply through banks or cooperative societies',
        'Land documents, Identity proof, Address proof',
        'All Commercial Banks, RRBs, Cooperative Banks',
        'All India',
        'Credit Support',
        'All categories of farmers',
        300000.00,
        1998,
        'https://www.nabard.org/auth/writereaddata/tender/1608180564KCC-Guidelines-2018.pdf',
        '{"phone": "022-26539895", "email": "helpdesk@nabard.org"}',
        true
    ),
    (
        'PM Fasal Bima Yojana',
        'Crop insurance scheme providing financial support to farmers in case of crop loss',
        'All farmers growing notified crops in notified areas',
        'Sum insured coverage for full crop loss and partial loss',
        'Apply through banks, insurance companies, or online portal',
        'Land records, Sowing certificate, Aadhaar Card',
        'Ministry of Agriculture & Farmers Welfare',
        'All India',
        'Insurance',
        'All farmers',
        0.00,
        2016,
        'https://pmfby.gov.in/',
        '{"phone": "1800-180-1551", "email": "support@pmfby.gov.in"}',
        true
    ),
    (
        'Maharashtra Solar Pump Scheme',
        'Subsidized solar-powered irrigation pumps for farmers',
        'Farmers with agricultural land and electricity connection',
        '90% subsidy on solar pump installation',
        'Apply through MSEDCL offices or online portal',
        'Land records, Electricity bill, Income certificate',
        'Maharashtra State Electricity Distribution Company Limited',
        'Maharashtra',
        'Infrastructure',
        'Farmers with irrigation needs',
        250000.00,
        2020,
        'https://www.mahadiscom.in/solar/',
        '{"phone": "1912", "email": "info@mahadiscom.in"}',
        true
    ),
    (
        'Tamil Nadu Free Laptop Scheme for Farmers',
        'Free laptops and tablets for progressive farmers and their children',
        'Farmers registered under various government schemes',
        'Free laptop/tablet worth Rs. 25,000',
        'Apply through agriculture extension offices',
        'Farmer registration proof, Income certificate, Educational certificates',
        'Department of Agriculture, Tamil Nadu',
        'Tamil Nadu',
        'Digital Support',
        'Progressive farmers and their families',
        25000.00,
        2021,
        'https://tn.gov.in/scheme/data_view/133842',
        '{"phone": "044-28415601", "email": "agri.tn@gov.in"}',
        true
    )

ON CONFLICT (scheme_name, COALESCE(state, '')) 
DO UPDATE SET
    description = EXCLUDED.description,
    benefits = EXCLUDED.benefits,
    last_updated = NOW();

-- Insert sample user profiles (these will be created when users sign up)
-- Note: These are just for reference, actual profiles created via auth

-- Show sample data counts
SELECT 'market_prices' as table_name, COUNT(*) as record_count FROM market_prices
UNION ALL
SELECT 'welfare_schemes' as table_name, COUNT(*) as record_count FROM welfare_schemes
UNION ALL
SELECT 'latest_market_prices' as table_name, COUNT(*) as record_count FROM latest_market_prices
ORDER BY table_name;
