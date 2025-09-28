import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Languages } from 'lucide-react';
import { AppSettings } from '../types';
import { updateAppSettings } from '../mockApi';
import { toast } from '@/hooks/use-toast';
import i18n from '../i18n';

interface LanguageCardProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
}

export function LanguageCard({ settings, onUpdate }: LanguageCardProps) {
  const { t } = useTranslation();

  const handleLanguageChange = async (language: 'en' | 'hi' | 'ta' | 'te') => {
    try {
      const updatedSettings = await updateAppSettings({ language });
      onUpdate(updatedSettings);
      
      // Update i18n language
      await i18n.changeLanguage(language);
      
      toast({
        title: t('settings.messages.languageChanged'),
        description: `Language changed to ${getLanguageDisplayName(language)}`,
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to update language',
        variant: 'destructive',
      });
    }
  };

  const getLanguageDisplayName = (lang: string) => {
    const names = {
      en: 'English',
      hi: 'हिंदी',
      ta: 'தமிழ்',
      te: 'తెలుగు',
    };
    return names[lang as keyof typeof names] || lang;
  };

  const languageOptions = [
    {
      value: 'en',
      label: 'English',
      nativeLabel: 'English',
    },
    {
      value: 'hi',
      label: 'Hindi',
      nativeLabel: 'हिंदी',
    },
    {
      value: 'ta',
      label: 'Tamil',
      nativeLabel: 'தமிழ்',
    },
    {
      value: 'te',
      label: 'Telugu',
      nativeLabel: 'తెలుగు',
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Languages className="w-5 h-5" />
          {t('settings.language.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={settings.language}
          onValueChange={handleLanguageChange}
          className="space-y-3"
        >
          {languageOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-3">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label
                htmlFor={option.value}
                className="flex items-center justify-between cursor-pointer flex-1 p-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-blue-800">{option.label}</div>
                  <div className="text-sm text-blue-600">{option.nativeLabel}</div>
                </div>
                {settings.language === option.value && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
