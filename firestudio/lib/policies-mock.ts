// ============================================================================
// MOCK POLICIES IMPLEMENTATION (Database-free)
// ============================================================================

import { useState, useEffect } from 'react';
import mockPolicies from '@/data/mock/agricultural_policies.json';

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

// In-memory policies data
let policiesData: AgriculturalPolicy[] = [...mockPolicies];

// ============================================================================
// SERVER-SIDE FUNCTIONS (for API routes or server components)
// ============================================================================

// Fetch all policies
export async function getAllPolicies(): Promise<AgriculturalPolicy[]> {
  try {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return policiesData
      .sort((a, b) => {
        const stateCompare = a.state.localeCompare(b.state);
        if (stateCompare !== 0) return stateCompare;
        return a.scheme_name.localeCompare(b.scheme_name);
      });
  } catch (error) {
    console.error('Failed to fetch all policies:', error);
    return [];
  }
}

// Fetch policies by state
export async function getPoliciesByState(state: string): Promise<AgriculturalPolicy[]> {
  try {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return policiesData
      .filter(policy => policy.state.toUpperCase() === state.toUpperCase())
      .sort((a, b) => a.scheme_name.localeCompare(b.scheme_name));
  } catch (error) {
    console.error(`Failed to fetch policies for state ${state}:`, error);
    return [];
  }
}

// Search policies by scheme name or explanation
export async function searchPolicies(searchTerm: string): Promise<AgriculturalPolicy[]> {
  try {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return policiesData
      .filter(policy => 
        policy.scheme_name.toLowerCase().includes(lowerSearchTerm) ||
        policy.explanation.toLowerCase().includes(lowerSearchTerm) ||
        policy.eligibility_criteria.toLowerCase().includes(lowerSearchTerm)
      )
      .sort((a, b) => {
        const stateCompare = a.state.localeCompare(b.state);
        if (stateCompare !== 0) return stateCompare;
        return a.scheme_name.localeCompare(b.scheme_name);
      })
      .slice(0, 50); // Limit to 50 results
  } catch (error) {
    console.error(`Failed to search policies with term "${searchTerm}":`, error);
    return [];
  }
}

// Get policy by ID
export async function getPolicyById(id: number): Promise<AgriculturalPolicy | null> {
  try {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return policiesData.find(policy => policy.id === id) || null;
  } catch (error) {
    console.error(`Failed to fetch policy with ID ${id}:`, error);
    return null;
  }
}

// Get all unique states
export async function getAllStates(): Promise<string[]> {
  try {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const uniqueStates = [...new Set(policiesData.map(policy => policy.state))];
    return uniqueStates.sort();
  } catch (error) {
    console.error('Failed to fetch states:', error);
    return [];
  }
}

// Get policy statistics
export async function getPolicyStatistics() {
  try {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Count policies by state
    const stateCounts = policiesData.reduce((acc: Record<string, number>, policy) => {
      acc[policy.state] = (acc[policy.state] || 0) + 1;
      return acc;
    }, {});

    return {
      totalPolicies: policiesData.length,
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
// CRUD OPERATIONS (for admin functionality)
// ============================================================================

// Add new policy
export async function addPolicy(policyData: Omit<AgriculturalPolicy, 'id' | 'created_at' | 'updated_at'>): Promise<AgriculturalPolicy> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const newPolicy: AgriculturalPolicy = {
    ...policyData,
    id: Math.max(...policiesData.map(p => p.id), 0) + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  policiesData.push(newPolicy);
  return newPolicy;
}

// Update existing policy
export async function updatePolicy(id: number, updateData: Partial<Omit<AgriculturalPolicy, 'id' | 'created_at'>>): Promise<AgriculturalPolicy | null> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const policyIndex = policiesData.findIndex(p => p.id === id);
  if (policyIndex === -1) return null;
  
  policiesData[policyIndex] = {
    ...policiesData[policyIndex],
    ...updateData,
    updated_at: new Date().toISOString()
  };
  
  return policiesData[policyIndex];
}

// Delete policy
export async function deletePolicy(id: number): Promise<boolean> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const policyIndex = policiesData.findIndex(p => p.id === id);
  if (policyIndex === -1) return false;
  
  policiesData.splice(policyIndex, 1);
  return true;
}

// ============================================================================
// CLIENT-SIDE REACT HOOKS
// ============================================================================

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
export function usePoliciesByState(state: string | null) {
  const [policies, setPolicies] = useState<AgriculturalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPolicies() {
      if (!state) {
        setPolicies([]);
        setLoading(false);
        return;
      }

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

// Hook to search policies
export function useSearchPolicies(searchTerm: string) {
  const [policies, setPolicies] = useState<AgriculturalPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function searchPoliciesData() {
      if (!searchTerm.trim()) {
        setPolicies([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await searchPolicies(searchTerm);
        setPolicies(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search policies');
      } finally {
        setLoading(false);
      }
    }

    const debounceTimer = setTimeout(searchPoliciesData, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return { policies, loading, error };
}
