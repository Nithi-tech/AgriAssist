-- ============================================================================
-- VERIFICATION QUERIES FOR AGRICULTURAL POLICIES
-- Run these in your Supabase SQL Editor after import
-- ============================================================================

-- 1. Check total number of policies imported
SELECT COUNT(*) as total_policies FROM public.agricultural_policies;

-- 2. Check policies by state
SELECT 
    state,
    COUNT(*) as policy_count
FROM public.agricultural_policies 
GROUP BY state 
ORDER BY policy_count DESC;

-- 3. Sample policies from each state
SELECT 
    state,
    scheme_name,
    LEFT(explanation, 100) || '...' as explanation_preview
FROM public.agricultural_policies 
ORDER BY state, scheme_name
LIMIT 20;

-- 4. Check for any null or empty values
SELECT 
    'Missing scheme names' as issue,
    COUNT(*) as count
FROM public.agricultural_policies 
WHERE scheme_name IS NULL OR scheme_name = ''

UNION ALL

SELECT 
    'Missing explanations' as issue,
    COUNT(*) as count
FROM public.agricultural_policies 
WHERE explanation IS NULL OR explanation = ''

UNION ALL

SELECT 
    'Missing eligibility criteria' as issue,
    COUNT(*) as count
FROM public.agricultural_policies 
WHERE eligibility_criteria IS NULL OR eligibility_criteria = '';

-- 5. Search functionality test
SELECT 
    id,
    state,
    scheme_name,
    LEFT(explanation, 80) || '...' as explanation_preview
FROM public.agricultural_policies 
WHERE scheme_name ILIKE '%kisan%' 
   OR explanation ILIKE '%kisan%'
ORDER BY state, scheme_name
LIMIT 10;

-- 6. State-specific query test (change 'MAHARASTRA' to any state)
SELECT 
    scheme_name,
    LEFT(eligibility_criteria, 100) || '...' as eligibility_preview,
    link
FROM public.agricultural_policies 
WHERE state = 'MAHARASTRA'
ORDER BY scheme_name
LIMIT 5;

-- 7. Check longest and shortest policy names
(SELECT 
    'Longest' as type,
    LENGTH(scheme_name) as name_length,
    scheme_name,
    state
FROM public.agricultural_policies 
ORDER BY LENGTH(scheme_name) DESC 
LIMIT 3)

UNION ALL

(SELECT 
    'Shortest' as type,
    LENGTH(scheme_name) as name_length,
    scheme_name,
    state
FROM public.agricultural_policies 
WHERE LENGTH(scheme_name) > 5
ORDER BY LENGTH(scheme_name) ASC 
LIMIT 3);

-- 8. Check for duplicate schemes (same name in same state)
SELECT 
    state,
    scheme_name,
    COUNT(*) as duplicate_count
FROM public.agricultural_policies 
GROUP BY state, scheme_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 9. Verify timestamps and triggers
SELECT 
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM public.agricultural_policies;

-- 10. Test search across all text fields
SELECT 
    state,
    scheme_name,
    CASE 
        WHEN scheme_name ILIKE '%subsidy%' THEN 'scheme_name'
        WHEN explanation ILIKE '%subsidy%' THEN 'explanation'
        WHEN eligibility_criteria ILIKE '%subsidy%' THEN 'eligibility'
        ELSE 'other'
    END as found_in
FROM public.agricultural_policies 
WHERE scheme_name ILIKE '%subsidy%' 
   OR explanation ILIKE '%subsidy%' 
   OR eligibility_criteria ILIKE '%subsidy%'
ORDER BY state, scheme_name
LIMIT 10;
