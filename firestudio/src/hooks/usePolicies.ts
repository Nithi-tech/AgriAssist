'use client';

import { useState, useEffect } from 'react';
import { AgriculturalPolicy, getAllPolicies, getPoliciesByState, searchPolicies } from '@/lib/policies';

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
