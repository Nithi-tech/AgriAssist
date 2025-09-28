'use client';

import { useContext, useState, useEffect, useCallback } from 'react';
import { LanguageContext, type Language } from '@/providers/language-provider-safe';
// Import i18n instance
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import i18n from '@/lib/i18n.js';

// Support exactly 7 languages as defined in i18n.js and language provider
const SUPPORTED_LANGUAGES: readonly Language[] = ['ta', 'en', 'hi', 'te', 'bn', 'as', 'gu'] as const;
const DEFAULT_LANGUAGE: Language = 'en';
const STORAGE_KEY = 'app.language';

// Type-safe language validation
const isValidLanguage = (lang: string): lang is Language => {
  return SUPPORTED_LANGUAGES.includes(lang as Language);
};

// Get language from localStorage with validation
const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidLanguage(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read language from localStorage:', error);
  }
  
  return DEFAULT_LANGUAGE;
};

// Enhanced hook that can work independently or with LanguageProvider
export function useLanguage() {
  const context = useContext(LanguageContext);
  const [independentLanguage, setIndependentLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isReady, setIsReady] = useState(false);

  // Initialize language (only when not using provider context)
  useEffect(() => {
    if (context) return; // Use provider when available
    
    const initLanguage = async () => {
      try {
        // Get language from multiple sources in priority order
        let targetLanguage: Language = DEFAULT_LANGUAGE;
        
        // 1. Check current i18n language
        if (i18n.language && isValidLanguage(i18n.language)) {
          targetLanguage = i18n.language;
        } else {
          // 2. Check localStorage
          const stored = getStoredLanguage();
          if (stored !== DEFAULT_LANGUAGE) {
            targetLanguage = stored;
          } else {
            // 3. Auto-detect from browser
            const browserLang = navigator.language.split('-')[0];
            if (isValidLanguage(browserLang)) {
              targetLanguage = browserLang;
            }
          }
          
          // Sync i18n with our target language
          await i18n.changeLanguage(targetLanguage);
        }
        
        setIndependentLanguage(targetLanguage);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize language in hook:', error);
        setIndependentLanguage(DEFAULT_LANGUAGE);
        setIsReady(true);
      }
    };

    initLanguage();
  }, [context]);

  // Language change handler for independent mode
  const handleLanguageChange = useCallback(async (newLanguage: Language) => {
    // Validate language support
    if (!isValidLanguage(newLanguage)) {
      console.warn(`❌ Unsupported language: ${newLanguage}. Falling back to ${DEFAULT_LANGUAGE}`);
      newLanguage = DEFAULT_LANGUAGE;
    }
    
    try {
      // Update i18n
      await i18n.changeLanguage(newLanguage);
      
      // Update state
      setIndependentLanguage(newLanguage);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, newLanguage);
      
      // Update HTML lang attribute for accessibility
      document.documentElement.lang = newLanguage;
      
      // Dispatch custom "languageChange" event for consistency
      window.dispatchEvent(new CustomEvent('languageChange', { 
        detail: { language: newLanguage, timestamp: Date.now() }
      }));
      
    } catch (error) {
      console.error('Failed to change language in hook:', error);
      // Fallback to default on error
      setIndependentLanguage(DEFAULT_LANGUAGE);
      await i18n.changeLanguage(DEFAULT_LANGUAGE);
      localStorage.setItem(STORAGE_KEY, DEFAULT_LANGUAGE);
    }
  }, []);

  // Get current language - always returns valid language code
  const getLanguage = useCallback((): Language => {
    if (context) {
      return context.language;
    }
    return independentLanguage;
  }, [context, independentLanguage]);

  // If provider context is available, use it
  if (context) {
    return {
      ...context,
      getLanguage,
    };
  }

  // Independent mode when no provider context
  return {
    language: independentLanguage,
    setLanguage: handleLanguageChange,
    getLanguage,
    isReady,
    // Provide a basic t function (or could return null if translations not needed)
    t: {} as any, // This would need proper implementation if used independently
  };
}
