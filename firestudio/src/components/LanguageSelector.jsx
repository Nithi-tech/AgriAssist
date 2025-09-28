'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Globe, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import i18n and languages from i18n.js
import i18n, { languages } from '@/lib/i18n';

// Filter to only the 7 supported languages
const SUPPORTED_LANGUAGES = ['ta', 'en', 'hi', 'te', 'bn', 'as', 'gu'];
const filteredLanguages = languages.filter(lang => SUPPORTED_LANGUAGES.includes(lang.code));

const LanguageSelector = () => {
  const { i18n, t } = useTranslation('common');
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Get current language details
  const getCurrentLanguage = () => {
    return filteredLanguages.find(lang => lang.code === currentLanguage) || filteredLanguages[0];
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

  useEffect(() => {
    // Load saved language from localStorage on component mount using 'app.lang' key
    const savedLanguage = localStorage.getItem('app.lang');
    if (savedLanguage && savedLanguage !== currentLanguage) {
      i18n.changeLanguage(savedLanguage);
      setCurrentLanguage(savedLanguage);
    }
  }, [currentLanguage]);

  const handleLanguageChange = async (languageCode) => {
    try {
      // Change language in i18next
      await i18n.changeLanguage(languageCode);
      
      // Save to localStorage using 'app.lang' key
      localStorage.setItem('app.lang', languageCode);
      
      // Update component state
      setCurrentLanguage(languageCode);
      
      // Dispatch CustomEvent for cross-tab sync
      window.dispatchEvent(new CustomEvent('languageChange', { detail: languageCode }));
      
      // Close dropdown
      setIsOpen(false);

      // Show success toast
      const selectedLanguage = filteredLanguages.find(l => l.code === languageCode);
      toast({
        title: t('settings.language_updated') || 'Language Updated',
        description: `${t('language_changed_to') || 'Language changed to'} ${selectedLanguage?.name}`,
      });

    } catch (error) {
      console.error('Failed to change language:', error);
      toast({
        title: t('error') || 'Error',
        description: t('language_change_failed') || 'Failed to change language',
        variant: 'destructive',
      });
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const currentLang = getCurrentLanguage();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('select_language') || 'Select Language'}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t('language_description') || 'Choose your preferred language for the application.'}
        </p>
        
        {/* Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          {/* Selected Language Display */}
          <Button
            variant="outline"
            className="w-full justify-between p-4 h-auto border-2 hover:border-primary/50 transition-all duration-200"
            onClick={toggleDropdown}
          >
            <div className="text-left">
              <div className="font-medium text-base">{currentLang.native}</div>
              <div className="text-sm text-muted-foreground">{currentLang.name}</div>
            </div>
            <ChevronDown 
              className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </Button>

          {/* Dropdown List */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {filteredLanguages.map((language) => (
                <button
                  key={language.code}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg flex items-center justify-between group ${
                    currentLanguage === language.code 
                      ? 'bg-green-50 border-l-4 border-l-green-500' 
                      : 'border-l-4 border-l-transparent'
                  }`}
                  onClick={() => handleLanguageChange(language.code)}
                >
                  <div>
                    <div className={`font-medium text-base ${
                      currentLanguage === language.code 
                        ? 'text-green-700' 
                        : 'text-gray-900 group-hover:text-primary'
                    }`}>
                      {language.native}
                    </div>
                    <div className={`text-sm ${
                      currentLanguage === language.code 
                        ? 'text-green-600' 
                        : 'text-muted-foreground'
                    }`}>
                      {language.name}
                    </div>
                  </div>
                  {currentLanguage === language.code && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Optional: Show current selection info */}
        <div className="mt-4 text-xs text-muted-foreground">
          {isOpen 
            ? 'Click on a language to select it' 
            : `Currently using: ${currentLang.native} (${currentLang.name})`
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageSelector;
