'use client';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/use-language';

/**
 * Unified translation hook that combines i18next and custom translations
 * Falls back gracefully between the two systems
 */
export function useUnifiedTranslation() {
  const { t: i18nT, i18n } = useTranslation('common');
  const { t: providerT, language } = useLanguage();

  const t = (key, fallback = key) => {
    // Try i18next first (for JSON-based translations)
    const i18nResult = i18nT(key);
    if (i18nResult && i18nResult !== key) {
      return i18nResult;
    }

    // Try custom translations (for TypeScript-based translations)
    const providerResult = providerT[key];
    if (providerResult) {
      return providerResult;
    }

    // Try nested keys (e.g., 'settings.title')
    const nestedKeys = key.split('.');
    if (nestedKeys.length > 1) {
      let result = providerT;
      for (const nestedKey of nestedKeys) {
        result = result?.[nestedKey];
        if (!result) break;
      }
      if (result) return result;
    }

    // Return fallback or key
    return fallback;
  };

  return {
    t,
    language: language || i18n.language,
    isReady: true,
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
