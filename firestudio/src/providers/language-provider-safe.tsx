'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect, useContext } from 'react';
import { translations } from '@/lib/translations';

// Define Language type to match exactly the 7 languages supported
export type Language = 'ta' | 'en' | 'hi' | 'te' | 'bn' | 'as' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Record<string, string>;
  isReady: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Support exactly 7 languages
const SUPPORTED_LANGUAGES: readonly Language[] = ['ta', 'en', 'hi', 'te', 'bn', 'as', 'gu'] as const;
const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'app.language';

// Type-safe language validation
const isValidLanguage = (lang: string): lang is Language => {
  return SUPPORTED_LANGUAGES.includes(lang as Language);
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Track if component is mounted to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize language from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;

    const initializeLanguage = () => {
      try {
        let targetLanguage: Language = DEFAULT_LANGUAGE;
        
        // Check localStorage first
        const storedLanguage = localStorage.getItem(STORAGE_KEY);
        if (storedLanguage && isValidLanguage(storedLanguage)) {
          targetLanguage = storedLanguage;
        } else {
          // Check browser language as fallback
          const browserLanguage = navigator.language.split('-')[0];
          if (isValidLanguage(browserLanguage)) {
            targetLanguage = browserLanguage;
          }
        }

        setLanguageState(targetLanguage);
        setIsReady(true);
      } catch (error) {
        console.error('Language initialization failed:', error);
        setLanguageState(DEFAULT_LANGUAGE);
        setIsReady(true);
      }
    };

    initializeLanguage();
  }, [isMounted]);

  // Handle language changes
  const setLanguage = async (newLanguage: Language) => {
    if (!isValidLanguage(newLanguage)) {
      console.warn(`Invalid language: ${newLanguage}, falling back to ${DEFAULT_LANGUAGE}`);
      newLanguage = DEFAULT_LANGUAGE;
    }

    try {
      setLanguageState(newLanguage);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newLanguage);
      }

      // Dispatch custom event for cross-tab sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('languageChange', { 
          detail: { language: newLanguage } 
        }));
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // Cross-tab sync
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLanguageChange = (event: CustomEvent<{ language: Language }>) => {
      const newLanguage = event.detail.language;
      if (isValidLanguage(newLanguage) && newLanguage !== language) {
        setLanguageState(newLanguage);
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        const newLanguage = event.newValue;
        if (isValidLanguage(newLanguage) && newLanguage !== language) {
          setLanguageState(newLanguage);
        }
      }
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [language]);

  // Get current translations
  const currentTranslations = translations[language] || translations.en;

  const contextValue = {
    language,
    setLanguage,
    t: currentTranslations,
    isReady: isReady && isMounted,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
