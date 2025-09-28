/**
 * Authentication Hook
 * Provides authentication utilities and protected route logic
 */

'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Hook for protecting routes that require authentication
 */
export function useRequireAuth(redirectTo: string = '/auth') {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading, isAuthenticated: !!user };
}

/**
 * Hook for redirecting authenticated users (e.g., from login page)
 */
export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading, isAuthenticated: !!user };
}

/**
 * Utility function to make authenticated API requests
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);

  if (response.status === 401) {
    // Redirect to login if unauthorized
    window.location.href = '/auth';
    throw new Error('Unauthorized');
  }

  return response;
}
