'use client';

import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/use-language';
import { useState, useEffect } from 'react';

/**
 * Unified translation hook that combines i18next and custom translations
 * Falls back gracefully between the two systems and handles SSR hydration
 */
export function useUnifiedTranslation() {
  const { t: i18nT, i18n } = useTranslation('common');
  const { t: providerT, language, isReady } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const t = (key, fallback = key) => {
    // During SSR, always return fallback to prevent hydration mismatch
    if (!isMounted || !isReady) {
      return fallback;
    }

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
        result = result && result[nestedKey];
        if (!result) break;
      }
      if (result) return result;
    }

    // Return fallback or key
    return fallback;
  };

  return {
    t,
    language: isMounted ? (language || i18n.language) : 'en',
    isReady: isMounted && isReady,
  };
}

// Export common translation keys for type safety
export const TRANSLATION_KEYS = Object.freeze({
  APP_NAME: 'appName',
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
  CROP_RECOMMENDATION: 'cropRecommendation',
  DISEASE_DIAGNOSIS: 'diseaseDiagnosis',
  WEATHER_FORECAST: 'weatherForecast',
  GOVT_SCHEMES: 'govtSchemes',
});
