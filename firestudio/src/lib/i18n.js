import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import only the 7 required translation files to avoid import errors
let enCommon, hiCommon, bnCommon, teCommon, taCommon, guCommon, asCommon;

try {
  enCommon = require('../locales/en/common.json');
} catch (e) {
  console.warn('English translations not found, using fallback');
  enCommon = {};
}

try {
  hiCommon = require('../locales/hi/common.json');
} catch (e) {
  console.warn('Hindi translations not found, using fallback');
  hiCommon = {};
}

try {
  bnCommon = require('../locales/bn/common.json');
} catch (e) {
  console.warn('Bengali translations not found, using fallback');
  bnCommon = {};
}

try {
  teCommon = require('../locales/te/common.json');
} catch (e) {
  console.warn('Telugu translations not found, using fallback');
  teCommon = {};
}

try {
  taCommon = require('../locales/ta/common.json');
} catch (e) {
  console.warn('Tamil translations not found, using fallback');
  taCommon = {};
}

try {
  guCommon = require('../locales/gu/common.json');
} catch (e) {
  console.warn('Gujarati translations not found, using fallback');
  guCommon = {};
}

try {
  asCommon = require('../locales/as/common.json');
} catch (e) {
  console.warn('Assamese translations not found, using fallback');
  asCommon = {};
}

// Only include the 7 supported languages
const resources = {
  en: { common: enCommon },
  hi: { common: hiCommon },
  bn: { common: bnCommon },
  te: { common: teCommon },
  ta: { common: taCommon },
  gu: { common: guCommon },
  as: { common: asCommon },
};


// Get saved language from localStorage with fallback
const getSavedLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  
  try {
    return localStorage.getItem('app.lang') || 'en';
  } catch (error) {
    console.warn('Failed to read language from localStorage:', error);
    return 'en';
  }
};

// Initialize i18n and wait for it to be ready
const initPromise = i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    debug: typeof window !== 'undefined' && localStorage.getItem('DEBUG_I18N') === 'true',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    // Support nested keys like navbar.home, dashboard.title
    keySeparator: '.',
    // Support array syntax for plurals
    pluralSeparator: '_',
    // Sync with localStorage changes
    saveMissing: false,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (typeof window !== 'undefined' && localStorage.getItem('DEBUG_I18N') === 'true') {
        console.warn(`🔍 i18next missing key: ${key} for language: ${lng}, using fallback: ${fallbackValue}`);
      }
    }
  });

// Listen for storage changes to sync across tabs/windows
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'app.lang' && e.newValue && e.newValue !== i18n.language) {
      // Validate newValue is a string and not an array/object
      const validLanguage = validateLanguageCode(e.newValue);
      if (validLanguage) {
        i18n.changeLanguage(validLanguage);
      }
    }
  });

  // Custom event for same-tab language changes from our provider
  window.addEventListener('languageChange', (e) => {
    const newLanguage = e.detail;
    // Validate newLanguage is a string and not an array/object
    const validLanguage = validateLanguageCode(newLanguage);
    if (validLanguage && validLanguage !== i18n.language) {
      i18n.changeLanguage(validLanguage).then(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('DEBUG_I18N') === 'true') {
          console.log(`🔄 i18next synced to language: ${validLanguage}`);
        }
      });
    }
  });
  
  // Force re-render of React components when language changes
  i18n.on('languageChanged', (lng) => {
    // Dispatch a custom event to notify React components
    window.dispatchEvent(new CustomEvent('i18nextLanguageChanged', { detail: lng }));
    
    // Update the HTML lang attribute for accessibility
    document.documentElement.lang = lng;
    
    if (typeof window !== 'undefined' && localStorage.getItem('DEBUG_I18N') === 'true') {
      console.log(`🌐 i18next language changed to: ${lng}`);
    }
  });
}

// Helper function to validate language codes
function validateLanguageCode(langCode) {
  // Check if it's a valid string
  if (typeof langCode !== 'string' || !langCode || langCode.trim() === '') {
    console.warn('Invalid language code: not a string or empty', langCode);
    return null;
  }

  // Check if it's an array or object (this prevents forEach errors)
  if (Array.isArray(langCode) || (typeof langCode === 'object' && langCode !== null)) {
    console.warn('Invalid language code: arrays and objects are not allowed', langCode);
    return null;
  }

  const trimmedCode = langCode.trim();
  const supportedLanguages = ['en', 'hi', 'bn', 'te', 'ta', 'gu', 'as'];
  
  // Check if it's a supported language
  if (!supportedLanguages.includes(trimmedCode)) {
    console.warn(`Unsupported language code: ${trimmedCode}. Falling back to 'en'`);
    return 'en';
  }

  return trimmedCode;
}

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'as', name: 'অসমীয়া' },
];

// Export the initialization promise for components that need to wait
export { initPromise };

// Export the configured i18n instance
export default i18n;
