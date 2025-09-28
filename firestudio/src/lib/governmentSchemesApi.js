// lib/governmentSchemesApi.js
import { supabase } from './supabaseClient';

/**
 * Server-side optimized API functions for large datasets
 * These functions perform filtering and search on the server side
 */

/**
 * Get schemes with server-side pagination and filtering
 */
export async function getSchemesWithPagination({
  page = 1,
  limit = 20,
  searchTerm = '',
  state = '',
  category = '',
  minBenefit = 0,
  maxBenefit = null,
  sortBy = 'scheme_name',
  sortOrder = 'asc'
}) {
  try {
    let query = supabase
      .from('welfare_schemes')
      .select('*', { count: 'exact' });

    // Apply search filter (server-side text search)
    if (searchTerm) {
      query = query.or(`scheme_name.ilike.%${searchTerm}%,eligibility.ilike.%${searchTerm}%`);
    }

    // Apply state filter
    if (state && state !== 'All') {
      query = query.eq('state', state);
    }

    // Apply category filter
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    // Apply benefit amount range filter
    if (maxBenefit !== null) {
      query = query
        .gte('benefit_amount', minBenefit)
        .lte('benefit_amount', maxBenefit);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
      hasNextPage: count ? from + limit < count : false,
      hasPrevPage: page > 1,
      error: null
    };
  } catch (error) {
    console.error('Error fetching paginated schemes:', error);
    return {
      data: [],
      totalCount: 0,
      currentPage: page,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      error: error.message
    };
  }
}

/**
 * Get unique filter options (cached on server)
 */
export async function getFilterOptions() {
  try {
    // Get unique states
    const { data: statesData } = await supabase
      .from('welfare_schemes')
      .select('state')
      .not('state', 'is', null);

    // Get unique categories
    const { data: categoriesData } = await supabase
      .from('welfare_schemes')
      .select('category')
      .not('category', 'is', null);

    // Get benefit amount range
    const { data: benefitData } = await supabase
      .from('welfare_schemes')
      .select('benefit_amount')
      .not('benefit_amount', 'is', null)
      .order('benefit_amount', { ascending: false })
      .limit(1);

    const states = [...new Set(statesData?.map(item => item.state).filter(Boolean))].sort();
    const categories = [...new Set(categoriesData?.map(item => item.category).filter(Boolean))].sort();
    const maxBenefit = benefitData?.[0]?.benefit_amount || 1000000;

    return {
      states,
      categories,
      maxBenefit,
      error: null
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      states: [],
      categories: [],
      maxBenefit: 1000000,
      error: error.message
    };
  }
}

/**
 * Advanced server-side search using PostgreSQL full-text search
 * Requires full-text search index on scheme_name and eligibility columns
 */
export async function fullTextSearch(searchTerm, options = {}) {
  try {
    const {
      limit = 50,
      state = '',
      category = ''
    } = options;

    let query = supabase
      .from('welfare_schemes')
      .select('*')
      // Use PostgreSQL full-text search (requires tsvector index)
      .textSearch('fts', searchTerm, {
        type: 'websearch',
        config: 'english'
      });

    if (state && state !== 'All') {
      query = query.eq('state', state);
    }

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    query = query
      .order('scheme_name', { ascending: true })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    return {
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('Error in full-text search:', error);
    // Fallback to ILIKE search
    return await fallbackSearch(searchTerm, options);
  }
}

/**
 * Fallback search using ILIKE (for when full-text search isn't available)
 */
export async function fallbackSearch(searchTerm, options = {}) {
  try {
    const {
      limit = 50,
      state = '',
      category = ''
    } = options;

    let query = supabase
      .from('welfare_schemes')
      .select('*')
      .or(`scheme_name.ilike.%${searchTerm}%,eligibility.ilike.%${searchTerm}%,explanation.ilike.%${searchTerm}%`);

    if (state && state !== 'All') {
      query = query.eq('state', state);
    }

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    query = query
      .order('scheme_name', { ascending: true })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    return {
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error('Error in fallback search:', error);
    return {
      data: [],
      error: error.message
    };
  }
}

/**
 * Get scheme statistics
 */
export async function getSchemeStatistics() {
  try {
    // Total schemes count
    const { count: totalSchemes } = await supabase
      .from('welfare_schemes')
      .select('*', { count: 'exact', head: true });

    // Schemes by state
    const { data: stateStats } = await supabase
      .from('welfare_schemes')
      .select('state')
      .not('state', 'is', null);

    // Schemes by category
    const { data: categoryStats } = await supabase
      .from('welfare_schemes')
      .select('category')
      .not('category', 'is', null);

    const schemesByState = stateStats?.reduce((acc, item) => {
      acc[item.state] = (acc[item.state] || 0) + 1;
      return acc;
    }, {}) || {};

    const schemesByCategory = categoryStats?.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      totalSchemes: totalSchemes || 0,
      schemesByState,
      schemesByCategory,
      error: null
    };
  } catch (error) {
    console.error('Error fetching scheme statistics:', error);
    return {
      totalSchemes: 0,
      schemesByState: {},
      schemesByCategory: {},
      error: error.message
    };
  }
}

/**
 * Performance optimization: Cache frequently accessed data
 */
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Cached version of getFilterOptions
 */
export async function getCachedFilterOptions() {
  const cacheKey = 'filter_options';
  const cached = getCachedData(cacheKey);
  
  if (cached) {
    return cached;
  }

  const result = await getFilterOptions();
  setCachedData(cacheKey, result);
  return result;
}

/**
 * SQL queries for creating optimized indexes (run these in Supabase SQL editor)
 */
export const optimizationQueries = `
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_state ON welfare_schemes(state);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_category ON welfare_schemes(category);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_benefit_amount ON welfare_schemes(benefit_amount);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_created_at ON welfare_schemes(created_at);

-- Create full-text search index (optional, for advanced search)
ALTER TABLE welfare_schemes ADD COLUMN IF NOT EXISTS fts tsvector;
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_fts ON welfare_schemes USING gin(fts);

-- Function to update full-text search column
CREATE OR REPLACE FUNCTION update_welfare_schemes_fts() RETURNS trigger AS $$
BEGIN
  NEW.fts := to_tsvector('english', coalesce(NEW.scheme_name,'') || ' ' || coalesce(NEW.eligibility,'') || ' ' || coalesce(NEW.explanation,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update fts column
DROP TRIGGER IF EXISTS welfare_schemes_fts_trigger ON welfare_schemes;
CREATE TRIGGER welfare_schemes_fts_trigger
  BEFORE INSERT OR UPDATE ON welfare_schemes
  FOR EACH ROW EXECUTE FUNCTION update_welfare_schemes_fts();

-- Update existing rows
UPDATE welfare_schemes SET fts = to_tsvector('english', coalesce(scheme_name,'') || ' ' || coalesce(eligibility,'') || ' ' || coalesce(explanation,''));
`;
