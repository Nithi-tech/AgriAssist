// Re-export the mock Supabase client for welfare functionality
export { supabase as default } from './supabase-mock';
export { supabase } from './supabase-mock';

// Mock functions for welfare schemes
export async function getWelfareSchemes() {
  return { data: [], error: null };
}

export async function getAllWelfareSchemes() {
  return { data: [], error: null };
}

export async function getFilteredWelfareSchemes(filters = {}) {
  return { data: [], error: null };
}

export async function getUniqueStates() {
  return { data: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Maharashtra', 'Tamil Nadu'], error: null };
}

export async function getUniqueCategories() {
  return { data: ['Agriculture', 'Education', 'Health', 'Employment', 'Social Security'], error: null };
}

export async function getWelfareSchemeStats() {
  return { 
    data: { 
      totalSchemes: 0, 
      schemesByState: {}, 
      schemesByCategory: {} 
    }, 
    error: null 
  };
}
