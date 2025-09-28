// ============================================================================
// PRODUCTION-READY SUPABASE WELFARE SCHEMES CLIENT
// Complete database operations with error handling and performance optimization
// ============================================================================

import { supabase } from './supabaseClient';

/**
 * 🚀 MAIN FUNCTIONS - Use these in your React components
 */

/**
 * Fetch all welfare schemes
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export const getAllWelfareSchemes = async () => {
  try {
    console.log('🔍 Fetching all welfare schemes...');
    
    const { data, error } = await supabase
      .from('welfare_schemes')
      .select(`
        id,
        scheme_name,
        state,
        category,
        eligibility,
        benefit_amount,
        benefit_type,
        explanation,
        target_beneficiaries,
        implementing_agency,
        launch_year,
        link,
        created_at
      `)
      .eq('is_active', true)
      .order('scheme_name', { ascending: true });

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} schemes`);
    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Error fetching welfare schemes:', error);
    return { 
      data: null, 
      error: error.message || 'Failed to fetch welfare schemes'
    };
  }
};

/**
 * Filter schemes by state and search keyword in eligibility
 * @param {string} state - State to filter by (use 'All' for no filter)
 * @param {string} searchKeyword - Keyword to search in eligibility field
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export const getFilteredWelfareSchemes = async (state = 'All', searchKeyword = '') => {
  try {
    console.log(`🔍 Filtering schemes - State: ${state}, Keyword: ${searchKeyword}`);
    
    let query = supabase
      .from('welfare_schemes')
      .select(`
        id,
        scheme_name,
        state,
        category,
        eligibility,
        benefit_amount,
        benefit_type,
        explanation,
        target_beneficiaries,
        implementing_agency,
        launch_year,
        link,
        created_at
      `)
      .eq('is_active', true);

    // Apply state filter
    if (state && state !== 'All') {
      query = query.eq('state', state);
    }

    // Apply search keyword filter (searches in multiple fields)
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.trim();
      query = query.or(
        `scheme_name.ilike.%${keyword}%,` +
        `eligibility.ilike.%${keyword}%,` +
        `explanation.ilike.%${keyword}%,` +
        `target_beneficiaries.ilike.%${keyword}%`
      );
    }

    // Order results
    query = query.order('scheme_name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Filter error:', error);
      throw error;
    }

    console.log(`✅ Filtered results: ${data?.length || 0} schemes found`);
    return { data, error: null };
    
  } catch (error) {
    console.error('❌ Error filtering welfare schemes:', error);
    return { 
      data: null, 
      error: error.message || 'Failed to filter welfare schemes'
    };
  }
};

/**
 * 📊 UTILITY FUNCTIONS
 */

/**
 * Get unique states for dropdown filter
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export const getUniqueStates = async () => {
  try {
    const { data, error } = await supabase
      .from('welfare_schemes')
      .select('state')
      .eq('is_active', true)
      .order('state');

    if (error) throw error;

    // Remove duplicates and filter out null/empty values
    const uniqueStates = [...new Set(
      data?.map(item => item.state).filter(state => state && state.trim())
    )].sort();

    return { data: uniqueStates, error: null };
    
  } catch (error) {
    console.error('❌ Error fetching unique states:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get unique categories for dropdown filter
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export const getUniqueCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('welfare_schemes')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null)
      .order('category');

    if (error) throw error;

    // Remove duplicates and filter out null/empty values
    const uniqueCategories = [...new Set(
      data?.map(item => item.category).filter(category => category && category.trim())
    )].sort();

    return { data: uniqueCategories, error: null };
    
  } catch (error) {
    console.error('❌ Error fetching unique categories:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get scheme statistics for dashboard
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export const getSchemeStatistics = async () => {
  try {
    // Get total count
    const { count: totalSchemes } = await supabase
      .from('welfare_schemes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get state distribution
    const { data: stateData } = await supabase
      .from('welfare_schemes')
      .select('state')
      .eq('is_active', true);

    // Get category distribution  
    const { data: categoryData } = await supabase
      .from('welfare_schemes')
      .select('category')
      .eq('is_active', true)
      .not('category', 'is', null);

    // Process distributions
    const schemesByState = stateData?.reduce((acc, curr) => {
      acc[curr.state] = (acc[curr.state] || 0) + 1;
      return acc;
    }, {}) || {};

    const schemesByCategory = categoryData?.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      data: {
        totalSchemes: totalSchemes || 0,
        schemesByState,
        schemesByCategory,
        topStates: Object.entries(schemesByState)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        topCategories: Object.entries(schemesByCategory)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      },
      error: null
    };
    
  } catch (error) {
    console.error('❌ Error fetching scheme statistics:', error);
    return { data: null, error: error.message };
  }
};

/**
 * 🛠️ ADMIN FUNCTIONS (require authentication)
 */

/**
 * Add a new welfare scheme (admin function)
 * @param {Object} schemeData - Scheme data object
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export const createWelfareScheme = async (schemeData) => {
  try {
    const { data, error } = await supabase
      .from('welfare_schemes')
      .insert([{
        ...schemeData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    
    console.log('✅ Scheme created successfully:', data[0]?.scheme_name);
    return { data: data[0], error: null };
    
  } catch (error) {
    console.error('❌ Error creating welfare scheme:', error);
    return { data: null, error: error.message };
  }
};

/**
 * 🔧 DATABASE CONNECTION TEST
 */

/**
 * Test database connection and table existence
 * @returns {Promise<{success: boolean, message: string, tableExists: boolean}>}
 */
export const testDatabaseConnection = async () => {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('welfare_schemes')
      .select('count', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('not found')) {
        return {
          success: false,
          message: '❌ Table "welfare_schemes" does not exist. Please create it using the SQL script.',
          tableExists: false
        };
      }
      throw error;
    }

    console.log('✅ Database connection successful');
    return {
      success: true,
      message: `✅ Connection successful! Table exists with ${data} records.`,
      tableExists: true
    };
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return {
      success: false,
      message: `❌ Connection failed: ${error.message}`,
      tableExists: false
    };
  }
};

/**
 * 📝 USAGE EXAMPLES IN REACT COMPONENTS:
 * 
 * // Get all schemes
 * const { data: schemes, error } = await getAllWelfareSchemes();
 * 
 * // Filter by state and keyword
 * const { data: filtered } = await getFilteredWelfareSchemes('Tamil Nadu', 'farmer');
 * 
 * // Get dropdown options
 * const { data: states } = await getUniqueStates();
 * const { data: categories } = await getUniqueCategories();
 * 
 * // Get statistics
 * const { data: stats } = await getSchemeStatistics();
 * 
 * // Test connection
 * const result = await testDatabaseConnection();
 * console.log(result.message);
 */
