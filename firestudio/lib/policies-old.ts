// ============================================================================
// SUPABASE POLICIES INTEGRATION EXAMPLES
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// Types for our agricultural policies
export interface AgriculturalPolicy {
  id: number;
  state: string;
  scheme_name: string;
  explanation: string;
  eligibility_criteria: string;
  link: string;
  created_at: string;
  updated_at: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// SERVER-SIDE FUNCTIONS (for API routes or server components)
// ============================================================================

// Fetch all policies
export async function getAllPolicies(): Promise<AgriculturalPolicy[]> {
  try {
    const { data, error } = await supabase
      .from('agricultural_policies')
      .select('*')
      .order('state', { ascending: true })
      .order('scheme_name', { ascending: true });

    if (error) {
      console.error('Error fetching policies:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch all policies:', error);
    return [];
  }
}

// Fetch policies by state
export async function getPoliciesByState(state: string): Promise<AgriculturalPolicy[]> {
  try {
    const { data, error } = await supabase
      .from('agricultural_policies')
      .select('*')
      .eq('state', state.toUpperCase())
      .order('scheme_name', { ascending: true });

    if (error) {
      console.error('Error fetching policies by state:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`Failed to fetch policies for state ${state}:`, error);
    return [];
  }
}

// Search policies by scheme name
export async function searchPolicies(searchTerm: string): Promise<AgriculturalPolicy[]> {
  try {
    const { data, error } = await supabase
      .from('agricultural_policies')
      .select('*')
      .or(`scheme_name.ilike.%${searchTerm}%,explanation.ilike.%${searchTerm}%`)
      .order('state', { ascending: true })
      .order('scheme_name', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error searching policies:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`Failed to search policies with term "${searchTerm}":`, error);
    return [];
  }
}

// Get policy by ID
export async function getPolicyById(id: number): Promise<AgriculturalPolicy | null> {
  try {
    const { data, error } = await supabase
      .from('agricultural_policies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching policy by ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Failed to fetch policy with ID ${id}:`, error);
    return null;
  }
}

// Get all unique states
export async function getAllStates(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('agricultural_policies')
      .select('state')
      .order('state', { ascending: true });

    if (error) {
      console.error('Error fetching states:', error);
      throw error;
    }

    // Get unique states
    const uniqueStates = [...new Set(data?.map(item => item.state) || [])];
    return uniqueStates;
  } catch (error) {
    console.error('Failed to fetch states:', error);
    return [];
  }
}

// Get policy statistics
export async function getPolicyStatistics() {
  try {
    const { data, error } = await supabase
      .from('agricultural_policies')
      .select('state')
      .order('state');

    if (error) {
      console.error('Error fetching policy statistics:', error);
      throw error;
    }

    // Count policies by state
    const stateCounts = data?.reduce((acc: Record<string, number>, policy) => {
      acc[policy.state] = (acc[policy.state] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      totalPolicies: data?.length || 0,
      totalStates: Object.keys(stateCounts).length,
      policiesByState: stateCounts
    };
  } catch (error) {
    console.error('Failed to fetch policy statistics:', error);
    return {
      totalPolicies: 0,
      totalStates: 0,
      policiesByState: {}
    };
  }
}

// ============================================================================
// CLIENT-SIDE REACT HOOKS
// ============================================================================

import { useState, useEffect } from 'react';

// Hook to fetch all policies
export function usePolicies() {
  const [policies, setPolicies] = useState<AgriculturalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPolicies() {
      try {
        setLoading(true);
        const data = await getAllPolicies();
        setPolicies(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch policies');
      } finally {
        setLoading(false);
      }
    }

    fetchPolicies();
  }, []);

  return { policies, loading, error };
}

// Hook to fetch policies by state
export function usePoliciesByState(state: string) {
  const [policies, setPolicies] = useState<AgriculturalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) {
      setPolicies([]);
      setLoading(false);
      return;
    }

    async function fetchPolicies() {
      try {
        setLoading(true);
        const data = await getPoliciesByState(state);
        setPolicies(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch policies');
      } finally {
        setLoading(false);
      }
    }

    fetchPolicies();
  }, [state]);

  return { policies, loading, error };
}

// ============================================================================
// API ROUTE EXAMPLES
// ============================================================================

// Example API route: /api/policies/route.ts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    const search = searchParams.get('search');

    let policies: AgriculturalPolicy[];

    if (search) {
      policies = await searchPolicies(search);
    } else if (state) {
      policies = await getPoliciesByState(state);
    } else {
      policies = await getAllPolicies();
    }

    return Response.json({
      success: true,
      data: policies,
      count: policies.length
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch policies' 
      },
      { status: 500 }
    );
  }
}

// Example API route: /api/policies/[id]/route.ts
export async function GET_BY_ID(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return Response.json(
        { success: false, error: 'Invalid policy ID' },
        { status: 400 }
      );
    }

    const policy = await getPolicyById(id);

    if (!policy) {
      return Response.json(
        { success: false, error: 'Policy not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to fetch policy' 
      },
      { status: 500 }
    );
  }
}
