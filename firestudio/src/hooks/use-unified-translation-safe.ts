'use client';

import { useLanguage } from '@/providers/language-provider-safe';

/**
 * Safe unified translation hook that avoids complex i18n interactions
 */
export function useUnifiedTranslation() {
  const { t, language, isReady } = useLanguage();

  // Simple translation function with fallback
  const translate = (key: string, fallback: string = key) => {
    if (!isReady) {
      return fallback;
    }
    
    return t[key] || fallback;
  };

  return {
    t: translate,
    language,
    isReady,
  };
}

// Export common translation keys for type safety
export const TRANSLATION_KEYS = {
  DASHBOARD: 'dashboard',
  SETTINGS: 'settings',
  SETTINGS_TITLE: 'settingsTitle',
  WELCOME: 'welcome',
  LANGUAGE: 'language',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  SAVE: 'save',
  CANCEL: 'cancel',
  CLOSE: 'close',
  SUBMIT: 'submit',
} as const;
