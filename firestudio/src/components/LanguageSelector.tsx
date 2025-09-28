'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { type Language } from '@/providers/language-provider';

// Supported 7 languages with their display names
const SUPPORTED_LANGUAGES: Array<{
  code: Language;
  name: string;
  nativeName: string;
  supportLevel: 'full' | 'partial' | 'coming';
}> = [
  { code: 'en', name: 'English', nativeName: 'English', supportLevel: 'full' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', supportLevel: 'full' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', supportLevel: 'full' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', supportLevel: 'full' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', supportLevel: 'full' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', supportLevel: 'full' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', supportLevel: 'full' },
];

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
  className?: string;
  onLanguageChange?: (language: Language) => void;
}

export function LanguageSelector({ 
  variant = 'default', 
  className = '',
  onLanguageChange 
}: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLanguage: string) => {
    const validLanguage = newLanguage as Language;
    
    // Validate the language is supported
    if (SUPPORTED_LANGUAGES.some(lang => lang.code === validLanguage)) {
      // Update language provider
      setLanguage(validLanguage);
      
      // Dispatch custom event for cross-tab sync
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('languageChange', { 
          detail: validLanguage 
        }));
      }
      
      // Call optional callback
      onLanguageChange?.(validLanguage);
    } else {
      // Fallback to English for unsupported languages
      setLanguage('en');
      onLanguageChange?.('en');
    }
  };

  const currentLanguageData = SUPPORTED_LANGUAGES.find(lang => lang.code === language);

  return (
    <div className={`space-y-2 ${className}`}>
      {variant === 'default' && (
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Globe className="h-4 w-4" />
          {t.selectLanguage || 'Select Language'}
        </div>
      )}
      
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full" aria-label={t.languageSelector || 'Language selector'}>
          <SelectValue>
            {currentLanguageData ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{currentLanguageData.nativeName}</span>
                <Badge variant="secondary" className="text-xs">
                  {currentLanguageData.name}
                </Badge>
              </div>
            ) : (
              t.selectLanguage || 'Select Language'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center gap-3 py-1">
                <div className="flex flex-col">
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="text-xs text-gray-500">{lang.name}</span>
                </div>
                {lang.supportLevel === 'full' && (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    {t.fullySupported || 'Fully Supported'}
                  </Badge>
                )}
                {lang.supportLevel === 'partial' && (
                  <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                    {t.partiallySupported || 'Partially Supported'}
                  </Badge>
                )}
                {lang.supportLevel === 'coming' && (
                  <Badge variant="outline" className="text-xs">
                    {t.comingSoon || 'Coming Soon'}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {variant === 'default' && (
        <p className="text-xs text-gray-500">
          {t.languageSupport || 'All 7 languages are fully supported with AI translation.'}
        </p>
      )}
    </div>
  );
}

export default LanguageSelector;
