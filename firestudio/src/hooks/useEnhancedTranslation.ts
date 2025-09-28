'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './use-language';
import { type Language } from '@/providers/language-provider';
import { translateResponse, batchTranslateResponse } from '@/utils/translateResponse';
// Import i18n instance to ensure consistency
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import i18n from '@/lib/i18n.js';

// Support exactly 7 languages as defined in i18n.js
const SUPPORTED_LANGUAGES: readonly Language[] = ['ta', 'en', 'hi', 'te', 'bn', 'as', 'gu'] as const;
const DEFAULT_LANGUAGE: Language = 'en';

// Type-safe language validation
const isValidLanguage = (lang: string): lang is Language => {
  return SUPPORTED_LANGUAGES.includes(lang as Language);
};

// Get validated language with fallback to English
const getValidatedLanguage = (language: string): Language => {
  return isValidLanguage(language) ? language : DEFAULT_LANGUAGE;
};

interface UseEnhancedTranslationReturn {
  t: (key: string, options?: any) => string;
  translateText: (text: string) => Promise<string>;
  translateTexts: (texts: string[]) => Promise<string[]>;
  language: Language;
  isTranslating: boolean;
  translationError: string | null;
}

/**
 * Enhanced translation hook that combines static JSON translations
 * with dynamic Gemini API translations for content
 */
export function useEnhancedTranslation(): UseEnhancedTranslationReturn {
  const { t: i18nT } = useTranslation('common');
  const { language: rawLanguage } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Validate and ensure we only use supported languages
  const validatedLanguage = getValidatedLanguage(rawLanguage);

  // Ensure i18n is using a supported language
  useEffect(() => {
    if (i18n.language !== validatedLanguage) {
      i18n.changeLanguage(validatedLanguage).catch((error: any) => {
        console.warn('Failed to sync i18n language:', error);
      });
    }
  }, [validatedLanguage]);

  /**
   * Get static translation from JSON files with type safety
   */
  const t = useCallback((key: string, options?: any): string => {
    try {
      const result = i18nT(key, options);
      // Ensure we always return a string
      return typeof result === 'string' ? result : key;
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }, [i18nT]);

  /**
   * Translate dynamic content using Gemini API with language validation
   */
  const translateText = useCallback(async (text: string): Promise<string> => {
    if (!text?.trim()) return text;

    // Use validated language for translation
    const targetLanguage = validatedLanguage;
    
    // Skip translation if already in English
    if (targetLanguage === DEFAULT_LANGUAGE) {
      return text;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const translated = await translateResponse(text, targetLanguage);
      return translated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Translation failed';
      setTranslationError(errorMessage);
      console.error('Translation error:', error);
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  }, [validatedLanguage]);

  /**
   * Translate multiple texts using Gemini API with language validation
   */
  const translateTexts = useCallback(async (texts: string[]): Promise<string[]> => {
    if (texts.length === 0) return texts;

    // Use validated language for translation
    const targetLanguage = validatedLanguage;
    
    // Skip translation if already in English
    if (targetLanguage === DEFAULT_LANGUAGE) {
      return texts;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const translated = await batchTranslateResponse(texts, targetLanguage);
      return translated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch translation failed';
      setTranslationError(errorMessage);
      console.error('Batch translation error:', error);
      return texts; // Return original texts on error
    } finally {
      setIsTranslating(false);
    }
  }, [validatedLanguage]);

  // Clear error when language changes
  useEffect(() => {
    setTranslationError(null);
  }, [validatedLanguage]);

  return {
    t,
    translateText,
    translateTexts,
    language: validatedLanguage,
    isTranslating,
    translationError
  };
}