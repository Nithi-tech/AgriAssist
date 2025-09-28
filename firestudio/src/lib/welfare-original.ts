// ============================================================================
// WELFARE SCHEMES API - ROBUST ERROR HANDLING
// ============================================================================

import { supabase } from './supabaseClient';

// TypeScript interfaces
export interface WelfareScheme {
  id: string;
  scheme_name: string;
  state: string;
  eligibility?: string;
  link?: string;
  explanation?: string;
  category?: string;
  benefit_amount?: number;
  created_at: string;
  updated_at?: string;
}

export interface WelfareApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

export interface SchemeFilters {
  state?: string;
  keyword?: string;
  category?: string;
  minBenefit?: number;
  maxBenefit?: number;
}

/**
 * Fetch all welfare schemes with error handling
 */
export async function fetchAllSchemes(): Promise<WelfareApiResponse<WelfareScheme[]>> {
  try {
    console.log('🔍 Fetching all welfare schemes...');
    
    const { data, error, count } = await supabase
      .from('welfare_schemes')
      .select(`
        id,
        scheme_name,
        state,
        category,
        eligibility,
        benefit_amount,
        explanation,
        link,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Handle specific PostgREST errors
    if (error) {
      console.error('❌ Supabase error:', error);
      
      // Check for table not found (schema cache issue)
      if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('schema cache')) {
        return {
          data: null,
          error: 'TABLE_NOT_FOUND: The welfare_schemes table does not exist or schema cache needs refresh. Please run the SQL migration script.',
          count: 0
        };
      }

      // Check for RLS policy issues  
      if (error.code === '42501' || error.message.includes('insufficient privilege')) {
        return {
          data: null,
          error: 'RLS_ERROR: Access denied. Please check Row Level Security policies for the welfare_schemes table.',
          count: 0
        };
      }

      // Generic error
      return {
        data: null,
        error: `Database error: ${error.message}`,
        count: 0
      };
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} schemes`);
    return {
      data: data || [],
      error: null,
      count: count || 0
    };

  } catch (err: any) {
    console.error('❌ Unexpected error in fetchAllSchemes:', err);
    return {
      data: null,
      error: `Unexpected error: ${err.message || 'Unknown error'}`,
      count: 0
    };
  }
}

/**
 * Fetch schemes with filters
 */
export async function fetchSchemesByFilters(filters: SchemeFilters = {}): Promise<WelfareApiResponse<WelfareScheme[]>> {
  try {
    const { state, keyword, category, minBenefit, maxBenefit } = filters;
    
    console.log('🔍 Fetching schemes with filters:', filters);
    
    let query = supabase
      .from('welfare_schemes')
      .select(`
        id,
        scheme_name,
        state,
        category,
        eligibility,
        benefit_amount,
        explanation,
        link,
        created_at,
        updated_at
      `, { count: 'exact' });

    // Apply state filter
    if (state && state !== 'All' && state.trim()) {
      query = query.eq('state', state);
    }

    // Apply category filter
    if (category && category !== 'All' && category.trim()) {
      query = query.eq('category', category);
    }

    // Apply keyword search (searches multiple fields)
    if (keyword && keyword.trim()) {
      const searchTerm = keyword.trim();
      query = query.or(
        `scheme_name.ilike.%${searchTerm}%,eligibility.ilike.%${searchTerm}%,explanation.ilike.%${searchTerm}%`
      );
    }

    // Apply benefit amount range filters
    if (minBenefit !== undefined && minBenefit >= 0) {
      query = query.gte('benefit_amount', minBenefit);
    }
    if (maxBenefit !== undefined && maxBenefit > 0) {
      query = query.lte('benefit_amount', maxBenefit);
    }

    // Order by created date (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    // Handle specific PostgREST errors (same as fetchAllSchemes)
    if (error) {
      console.error('❌ Supabase filter error:', error);
      
      if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('schema cache')) {
        return {
          data: null,
          error: 'TABLE_NOT_FOUND: The welfare_schemes table does not exist or schema cache needs refresh.',
          count: 0
        };
      }

      if (error.code === '42501' || error.message.includes('insufficient privilege')) {
        return {
          data: null,
          error: 'RLS_ERROR: Access denied. Check Row Level Security policies.',
          count: 0
        };
      }

      return {
        data: null,
        error: `Filter error: ${error.message}`,
        count: 0
      };
    }

    console.log(`✅ Filter results: ${data?.length || 0} schemes found`);
    return {
      data: data || [],
      error: null,
      count: count || 0
    };

  } catch (err: any) {
    console.error('❌ Unexpected error in fetchSchemesByFilters:', err);
    return {
      data: null,
      error: `Unexpected filter error: ${err.message || 'Unknown error'}`,
      count: 0
    };
  }
}

/**
 * Get unique states for dropdown options
 */
export async function fetchUniqueStates(): Promise<WelfareApiResponse<string[]>> {
  try {
    const { data, error } = await supabase
      .from('welfare_schemes')
      .select('state')
      .not('state', 'is', null);

    if (error) {
      console.error('❌ Error fetching states:', error);
      return { data: null, error: error.message };
    }

    // Remove duplicates and sort
    const uniqueStates = [...new Set(data?.map(item => item.state).filter(Boolean))].sort();
    
    return { data: uniqueStates, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Get unique categories for dropdown options
 */
export async function fetchUniqueCategories(): Promise<WelfareApiResponse<string[]>> {
  try {
    const { data, error } = await supabase
      .from('welfare_schemes')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('❌ Error fetching categories:', error);
      return { data: null, error: error.message };
    }

    // Remove duplicates and sort
    const uniqueCategories = [...new Set(data?.map(item => item.category).filter(Boolean))].sort();
    
    return { data: uniqueCategories, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<WelfareApiResponse<{ message: string; tableExists: boolean }>> {
  try {
    const { data, error } = await supabase
      .from('welfare_schemes')
      .select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return {
          data: { message: 'Table does not exist', tableExists: false },
          error: 'TABLE_NOT_FOUND'
        };
      }
      return {
        data: { message: 'Connection failed', tableExists: false },
        error: error.message
      };
    }

    return {
      data: { message: `Connection successful. Table has ${data} records.`, tableExists: true },
      error: null
    };
  } catch (err: any) {
    return {
      data: { message: 'Connection test failed', tableExists: false },
      error: err.message
    };
  }
}
