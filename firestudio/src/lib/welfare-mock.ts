// ============================================================================
// WELFARE SCHEMES API - MOCK IMPLEMENTATION
// ============================================================================

import mockPolicies from '@/data/mock/agricultural_policies.json';

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

export interface SearchFilters {
  state?: string;
  category?: string;
  minBenefit?: number;
  maxBenefit?: number;
  searchTerm?: string;
}

// Transform mock policies to welfare schemes format
const transformPolicyToWelfareScheme = (policy: any): WelfareScheme => ({
  id: policy.id.toString(),
  scheme_name: policy.scheme_name,
  state: policy.state,
  eligibility: policy.eligibility_criteria,
  link: policy.link,
  explanation: policy.explanation,
  category: 'Agricultural',
  benefit_amount: Math.floor(Math.random() * 50000) + 10000, // Mock benefit amount
  created_at: policy.created_at,
  updated_at: policy.updated_at || policy.created_at
});

// Convert mock data to welfare schemes
const mockWelfareSchemes: WelfareScheme[] = mockPolicies.map(transformPolicyToWelfareScheme);

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all welfare schemes with optional pagination
 */
export async function getAllWelfareSchemes(page: number = 1, limit: number = 20): Promise<{
  data: WelfareScheme[];
  error: any;
  count: number;
  totalPages: number;
}> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedData = mockWelfareSchemes.slice(startIndex, endIndex);
    const totalPages = Math.ceil(mockWelfareSchemes.length / limit);

    return {
      data: paginatedData,
      error: null,
      count: mockWelfareSchemes.length,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching welfare schemes:', error);
    return {
      data: [],
      error,
      count: 0,
      totalPages: 0
    };
  }
}

/**
 * Search welfare schemes with filters
 */
export async function searchWelfareSchemes(filters: SearchFilters): Promise<{
  data: WelfareScheme[];
  error: any;
  count: number;
}> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));

    let filteredData = [...mockWelfareSchemes];

    // Apply state filter
    if (filters.state) {
      filteredData = filteredData.filter(scheme => 
        scheme.state.toLowerCase() === filters.state!.toLowerCase()
      );
    }

    // Apply category filter
    if (filters.category) {
      filteredData = filteredData.filter(scheme => 
        scheme.category?.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    // Apply benefit amount filters
    if (filters.minBenefit !== undefined) {
      filteredData = filteredData.filter(scheme => 
        (scheme.benefit_amount || 0) >= filters.minBenefit!
      );
    }

    if (filters.maxBenefit !== undefined) {
      filteredData = filteredData.filter(scheme => 
        (scheme.benefit_amount || 0) <= filters.maxBenefit!
      );
    }

    // Apply search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredData = filteredData.filter(scheme => 
        scheme.scheme_name.toLowerCase().includes(searchLower) ||
        scheme.explanation?.toLowerCase().includes(searchLower) ||
        scheme.eligibility?.toLowerCase().includes(searchLower)
      );
    }

    return {
      data: filteredData,
      error: null,
      count: filteredData.length
    };
  } catch (error) {
    console.error('Error searching welfare schemes:', error);
    return {
      data: [],
      error,
      count: 0
    };
  }
}

/**
 * Get welfare scheme by ID
 */
export async function getWelfareSchemeById(id: string): Promise<{
  data: WelfareScheme | null;
  error: any;
}> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150));

    const scheme = mockWelfareSchemes.find(s => s.id === id);
    
    if (!scheme) {
      return {
        data: null,
        error: { message: 'Welfare scheme not found' }
      };
    }

    return {
      data: scheme,
      error: null
    };
  } catch (error) {
    console.error('Error fetching welfare scheme:', error);
    return {
      data: null,
      error
    };
  }
}

/**
 * Get unique states
 */
export async function getUniqueStates(): Promise<{
  data: string[];
  error: any;
}> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const uniqueStates = [...new Set(mockWelfareSchemes.map(scheme => scheme.state))];
    
    return {
      data: uniqueStates.sort(),
      error: null
    };
  } catch (error) {
    console.error('Error fetching unique states:', error);
    return {
      data: [],
      error
    };
  }
}

/**
 * Get unique categories
 */
export async function getUniqueCategories(): Promise<{
  data: string[];
  error: any;
}> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const uniqueCategories = [...new Set(mockWelfareSchemes.map(scheme => scheme.category))].filter(Boolean) as string[];
    
    return {
      data: uniqueCategories.sort(),
      error: null
    };
  } catch (error) {
    console.error('Error fetching unique categories:', error);
    return {
      data: [],
      error
    };
  }
}

/**
 * Get welfare scheme statistics
 */
export async function getWelfareStatistics(): Promise<{
  data: {
    totalSchemes: number;
    schemesByState: { [key: string]: number };
    schemesByCategory: { [key: string]: number };
    averageBenefit: number;
    totalBenefitAmount: number;
  } | null;
  error: any;
}> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const schemesByState = mockWelfareSchemes.reduce((acc: { [key: string]: number }, scheme) => {
      acc[scheme.state] = (acc[scheme.state] || 0) + 1;
      return acc;
    }, {});

    const schemesByCategory = mockWelfareSchemes.reduce((acc: { [key: string]: number }, scheme) => {
      const category = scheme.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const totalBenefitAmount = mockWelfareSchemes.reduce((sum, scheme) => 
      sum + (scheme.benefit_amount || 0), 0
    );
    
    const averageBenefit = totalBenefitAmount / mockWelfareSchemes.length;

    return {
      data: {
        totalSchemes: mockWelfareSchemes.length,
        schemesByState,
        schemesByCategory,
        averageBenefit: Math.round(averageBenefit),
        totalBenefitAmount
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching welfare statistics:', error);
    return {
      data: null,
      error
    };
  }
}

/**
 * Add new welfare scheme (for admin functionality)
 */
export async function addWelfareScheme(schemeData: Omit<WelfareScheme, 'id' | 'created_at' | 'updated_at'>): Promise<{
  data: WelfareScheme | null;
  error: any;
}> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const newScheme: WelfareScheme = {
      ...schemeData,
      id: (Math.max(...mockWelfareSchemes.map(s => parseInt(s.id)), 0) + 1).toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockWelfareSchemes.push(newScheme);

    return {
      data: newScheme,
      error: null
    };
  } catch (error) {
    console.error('Error adding welfare scheme:', error);
    return {
      data: null,
      error
    };
  }
}

/**
 * Update welfare scheme
 */
export async function updateWelfareScheme(id: string, updates: Partial<WelfareScheme>): Promise<{
  data: WelfareScheme | null;
  error: any;
}> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const schemeIndex = mockWelfareSchemes.findIndex(s => s.id === id);
    
    if (schemeIndex === -1) {
      return {
        data: null,
        error: { message: 'Welfare scheme not found' }
      };
    }

    mockWelfareSchemes[schemeIndex] = {
      ...mockWelfareSchemes[schemeIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return {
      data: mockWelfareSchemes[schemeIndex],
      error: null
    };
  } catch (error) {
    console.error('Error updating welfare scheme:', error);
    return {
      data: null,
      error
    };
  }
}

/**
 * Delete welfare scheme
 */
export async function deleteWelfareScheme(id: string): Promise<{
  error: any;
}> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150));

    const schemeIndex = mockWelfareSchemes.findIndex(s => s.id === id);
    
    if (schemeIndex === -1) {
      return {
        error: { message: 'Welfare scheme not found' }
      };
    }

    mockWelfareSchemes.splice(schemeIndex, 1);

    return {
      error: null
    };
  } catch (error) {
    console.error('Error deleting welfare scheme:', error);
    return {
      error
    };
  }
}
