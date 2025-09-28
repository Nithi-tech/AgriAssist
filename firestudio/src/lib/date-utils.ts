/**
 * Date formatting utilities that prevent hydration mismatches
 * by ensuring consistent formatting between server and client
 */

import { useEffect, useState } from 'react';

/**
 * Hook to safely format dates on the client side to prevent hydration mismatches
 */
export function useClientDate() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDate = (dateString: string | undefined | null, fallback = 'Not set') => {
    if (!dateString) return fallback;
    if (!isClient) return fallback; // Return fallback during SSR
    
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return fallback;
    }
  };

  const formatDateTime = (dateString: string | undefined | null, fallback = 'Not set') => {
    if (!dateString) return fallback;
    if (!isClient) return fallback; // Return fallback during SSR
    
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return fallback;
    }
  };

  const formatTimeAgo = (dateString: string | undefined | null, fallback = 'Unknown') => {
    if (!dateString) return fallback;
    if (!isClient) return fallback; // Return fallback during SSR
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch {
      return fallback;
    }
  };

  return { formatDate, formatDateTime, formatTimeAgo, isClient };
}

/**
 * Safe date formatting function for use in components
 * Returns a consistent format that won't cause hydration mismatches
 */
export function formatDateSafe(dateString: string | undefined | null, fallback = 'Not set'): string {
  if (!dateString) return fallback;
  
  // Use a consistent format that doesn't depend on locale
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch {
    return fallback;
  }
}

/**
 * Safe current time hook that prevents hydration mismatches
 */
export function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return currentTime;
}
