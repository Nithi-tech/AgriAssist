'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Globe, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StaticLanguageSelector = () => {
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  ];

  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    setIsOpen(false);
    
    const selectedLang = languages.find(lang => lang.code === langCode);
    
    toast({
      title: '🌐 Language Updated!',
      description: `Language switched to ${selectedLang?.name}`,
      duration: 3000,
    });

    // Store in localStorage for future use
    try {
      localStorage.setItem('preferred-language', langCode);
    } catch (error) {
      console.warn('Could not save language preference:', error);
    }
  };

  // Load saved language preference
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('preferred-language');
      if (saved && languages.find(lang => lang.code === saved)) {
        setCurrentLanguage(saved);
      }
    } catch (error) {
      console.warn('Could not load language preference:', error);
    }
  }, []);

  const currentLangInfo = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          className="w-full justify-between h-12 px-4 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-blue-500" />
            <span className="text-lg">{currentLangInfo.flag}</span>
            <span className="font-medium text-gray-700">{currentLangInfo.name}</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50">
            <Card className="border-2 border-gray-200 shadow-xl">
              <CardContent className="p-2">
                {languages.map((language) => (
                  <Button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    variant={currentLanguage === language.code ? 'default' : 'ghost'}
                    className={`w-full justify-start h-12 px-3 mb-1 text-left transition-all duration-200 ${
                      currentLanguage === language.code
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{language.flag}</span>
                        <span className="font-medium">{language.name}</span>
                      </div>
                      {currentLanguage === language.code && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          💡 Language changes will be applied throughout the app
        </p>
      </div>
    </div>
  );
};

export default StaticLanguageSelector;
