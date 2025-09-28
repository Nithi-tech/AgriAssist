'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

// Import the configured i18n instance directly
import i18n, { initPromise } from '@/lib/i18n.js';

// Define only the 7 supported languages
const SUPPORTED_LANGUAGES = [
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'en', name: 'English', native: 'English', flag: '��' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '��' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '��' },
];

const ModernLanguageSelector = () => {
  const { t: i18nT, i18n: i18nFromHook } = useTranslation('common');
  const { language: providerLanguage, setLanguage: setProviderLanguage, t: providerT, isReady } = useLanguage();
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = useState(providerLanguage || 'en');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get current language details
  const getCurrentLanguage = () => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES.find(lang => lang.code === 'en');
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync with provider language changes
  useEffect(() => {
    if (providerLanguage !== currentLanguage) {
      setCurrentLanguage(providerLanguage);
    }
  }, [providerLanguage, currentLanguage]);

  useEffect(() => {
    // Initialize and sync language state when provider is ready
    if (isReady && providerLanguage) {
      setCurrentLanguage(providerLanguage);
    }
  }, [isReady, providerLanguage]);

  // Sync with i18n language changes using the hook
  useEffect(() => {
    if (i18nFromHook.language !== currentLanguage) {
      setCurrentLanguage(i18nFromHook.language);
    }
  }, [i18nFromHook.language, currentLanguage]);

  const handleLanguageChange = async (languageCode) => {
    try {
      // Prevent rapid toggling with debounced check
      if (languageCode === currentLanguage) {
        setIsOpen(false);
        return;
      }

      // Validate the language is supported, fallback to English if not
      const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
      const finalLanguageCode = isSupported ? languageCode : 'en';

      // Update both the provider and i18next
      setProviderLanguage(finalLanguageCode);
      setCurrentLanguage(finalLanguageCode);
      
      // Dispatch custom event for cross-tab sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('languageChange', { 
          detail: finalLanguageCode 
        }));
      }
      
      // Close dropdown
      setIsOpen(false);

      // Show success toast with error handling
      const selectedLanguage = SUPPORTED_LANGUAGES.find(l => l.code === finalLanguageCode);
      if (toast) {
        toast({
          title: providerT?.languageUpdated || '🎉 Language Updated!',
          description: `${providerT?.switchedTo || 'Switched to'} ${selectedLanguage?.flag} ${selectedLanguage?.native}`,
          duration: 3000,
        });
      }

    } catch (error) {
      console.error('Failed to change language:', error);
      
      // Fallback error handling
      if (toast) {
        toast({
          title: providerT?.error || '❌ Error',
          description: providerT?.languageChangeError || 'Failed to change language. Please try again.',
          variant: 'destructive',
        });
      } else {
        // Fallback to alert if toast is not available
        alert(providerT?.languageChangeErrorAlert || 'Failed to change language. Please refresh the page and try again.');
      }
      
      // Don't close dropdown on error
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const currentLang = getCurrentLanguage();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Language Display */}
      <Button
        variant="outline"
        className="w-full justify-between p-4 h-auto bg-white hover:bg-gray-50 border-2 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md group"
        onClick={toggleDropdown}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            <span className="text-2xl">{currentLang.flag}</span>
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
              🌐 {currentLang.native}
            </div>
            <div className="text-sm text-gray-500 group-hover:text-green-600 transition-colors">
              {currentLang.name}
            </div>
          </div>
        </div>
        <ChevronDown 
          className={`h-5 w-5 text-gray-400 group-hover:text-green-600 transition-all duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </Button>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto transform animate-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between group hover:scale-102 ${
                  currentLanguage === language.code 
                    ? 'bg-green-50 border border-green-200 shadow-sm' 
                    : 'hover:bg-gray-50 hover:shadow-sm'
                }`}
                onClick={() => handleLanguageChange(language.code)}
                title={`${providerT?.selectLanguage || 'Select'} ${language.native} (${language.name})`}
                aria-label={`${providerT?.selectLanguage || 'Select language'}: ${language.native}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{language.flag}</span>
                  <div>
                    <div className={`font-medium ${
                      currentLanguage === language.code 
                        ? 'text-green-700' 
                        : 'text-gray-900 group-hover:text-green-600'
                    } transition-colors`}>
                      {language.native}
                    </div>
                    <div className={`text-sm ${
                      currentLanguage === language.code 
                        ? 'text-green-600' 
                        : 'text-gray-500 group-hover:text-green-500'
                    } transition-colors`}>
                      {language.name}
                    </div>
                  </div>
                </div>
                {currentLanguage === language.code && (
                  <Check className="h-5 w-5 text-green-600 animate-in zoom-in-50 duration-200" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernLanguageSelector;
