'use client';

import { useLanguage as useSafeLanguage } from '@/providers/language-provider-safe';

/**
 * Simple wrapper around the safe language provider
 * This maintains API compatibility while using the safer implementation
 */
export function useLanguage() {
  return useSafeLanguage();
}

// Re-export types for compatibility
export type { Language } from '@/providers/language-provider-safe';
