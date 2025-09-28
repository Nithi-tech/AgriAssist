// TypeScript definitions for our i18n system
import type { i18n } from 'i18next';

// Language interface
export interface Language {
  code: string;
  name: string;
}

// Supported language codes (7 languages)
export type SupportedLanguage = 'ta' | 'en' | 'hi' | 'te' | 'bn' | 'as' | 'gu';

// Type for the i18n instance
export type I18nInstance = i18n;

// Re-export the i18n configuration from the JS file
// This avoids circular references while providing TypeScript support
const i18nModule = require('./i18n.js');

export const languages: Language[] = i18nModule.languages;
export const initPromise: Promise<any> = i18nModule.initPromise;
export default i18nModule.default as I18nInstance;