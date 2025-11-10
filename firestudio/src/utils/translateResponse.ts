// utils/translateResponse.ts
// Translation utility that uses the secure Gemini API route

// Define language type locally to avoid import issues
type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'as';

export interface TranslationCache {
  [key: string]: string;
}

// In-memory cache for translations to avoid redundant API calls
const translationCache: TranslationCache = {};

// Support exactly 7 languages as defined in i18n.js
const SUPPORTED_LANGUAGES: readonly Language[] = ['ta', 'en', 'hi', 'te', 'bn', 'as', 'gu', 'mr'] as const;
const DEFAULT_LANGUAGE: Language = 'en';

// Language mapping for better Gemini API understanding (restricted to 7 languages)
const languageMap: Record<Language, string> = {
  'en': 'English',
  'hi': 'Hindi',
  'ta': 'Tamil',
  'te': 'Telugu',
  'bn': 'Bengali',
  'as': 'Assamese',
  'gu': 'Gujarati',
  'mr': 'Marathi'
};

// Type-safe language validation
const isValidLanguage = (lang: string): lang is Language => {
  return SUPPORTED_LANGUAGES.includes(lang as Language);
};

// Get validated language with fallback to English
const getValidatedLanguage = (language: string): Language => {
  const validatedLang = isValidLanguage(language) ? language : DEFAULT_LANGUAGE;
  
  // Log fallback for debugging
  if (language !== validatedLang) {
    console.warn(`Unsupported language '${language}' requested. Falling back to '${validatedLang}'.`);
  }
  
  return validatedLang;
};

/**
 * Translates text using Google Gemini API with language validation
 * @param text - Text to translate
 * @param targetLang - Target language code (must be one of 7 supported languages)
 * @returns Promise<string> - Translated text or original text if translation fails
 */
export async function translateResponse(text: string, targetLang: string): Promise<string> {
  // Validate and get supported language
  const validatedLang = getValidatedLanguage(targetLang);
  
  // Return original text if target language is English or text is empty
  if (validatedLang === DEFAULT_LANGUAGE || !text?.trim()) {
    return text;
  }

  // Check cache first (using validated language)
  const cacheKey = `${text}:${validatedLang}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // Get language name for better API understanding
  const targetLanguage = languageMap[validatedLang];

  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('Gemini API key not found. Using original text.');
      return text;
    }

    // Use the secure API route instead of direct Gemini call
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'translation',
        text: text,
        targetLanguage: targetLanguage,
        sourceLanguage: 'auto'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Translation API failed:', errorData);
      throw new Error(`Translation API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      const translatedText = data.data.response?.trim();
      
      if (translatedText) {
        // Cache the translation
        translationCache[cacheKey] = translatedText;
        return translatedText;
      }
    }
    
    console.warn('No translation received from API');
    return text;

  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

/**
 * Batch translate multiple texts with language validation
 * @param texts - Array of texts to translate
 * @param targetLang - Target language code (must be one of 7 supported languages)
 * @returns Promise<string[]> - Array of translated texts
 */
export async function batchTranslateResponse(texts: string[], targetLang: string): Promise<string[]> {
  // Validate language first
  const validatedLang = getValidatedLanguage(targetLang);
  
  if (validatedLang === DEFAULT_LANGUAGE) {
    return texts;
  }

  // For batch translation, we'll translate each text individually
  // In a production environment, you might want to optimize this further
  const promises = texts.map(text => translateResponse(text, validatedLang));
  return Promise.all(promises);
}

/**
 * Clear translation cache (useful for memory management)
 */
export function clearTranslationCache(): void {
  Object.keys(translationCache).forEach(key => delete translationCache[key]);
}

/**
 * Get cache size for debugging
 */
export function getTranslationCacheSize(): number {
  return Object.keys(translationCache).length;
}

/**
 * Get the current active language from localStorage (fallback approach)
 * Note: Removed i18n dependency to avoid build conflicts with Genkit
 * @returns Language - Current active language (validated against supported languages)
 */
export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  try {
    const savedLang = localStorage.getItem('app.lang') || DEFAULT_LANGUAGE;
    return getValidatedLanguage(savedLang);
  } catch (error) {
    console.warn('Failed to read language from localStorage:', error);
    return DEFAULT_LANGUAGE;
  }
}

/**
 * Check if a language is supported for translation
 * @param lang - Language code to check
 * @returns boolean - True if language is supported
 */
export function isSupportedLanguage(lang: string): lang is Language {
  return isValidLanguage(lang);
}

/**
 * Get all supported languages
 * @returns readonly Language[] - Array of supported language codes
 */
export function getSupportedLanguages(): readonly Language[] {
  return SUPPORTED_LANGUAGES;
}

/**
 * Get language display name
 * @param lang - Language code
 * @returns string - Human-readable language name
 */
export function getLanguageDisplayName(lang: string): string {
  const validatedLang = getValidatedLanguage(lang);
  return languageMap[validatedLang];
}
