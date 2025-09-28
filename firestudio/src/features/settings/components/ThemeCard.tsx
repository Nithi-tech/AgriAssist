import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Palette, Monitor, Sun, Moon } from 'lucide-react';
import { AppSettings } from '../types';
import { updateAppSettings } from '../mockApi';
import { toast } from '@/hooks/use-toast';

interface ThemeCardProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
}

export function ThemeCard({ settings, onUpdate }: ThemeCardProps) {
  const { t } = useTranslation();

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    try {
      const updatedSettings = await updateAppSettings({ theme });
      onUpdate(updatedSettings);
      
      // Apply theme to document
      applyTheme(theme);
      
      toast({
        title: t('settings.messages.themeChanged'),
        description: `Theme changed to ${theme}`,
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to update theme',
        variant: 'destructive',
      });
    }
  };

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  // Listen for system theme changes when system theme is selected
  React.useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  const themeOptions = [
    {
      value: 'light',
      label: t('settings.theme.light'),
      icon: Sun,
      description: 'Light theme',
    },
    {
      value: 'dark',
      label: t('settings.theme.dark'),
      icon: Moon,
      description: 'Dark theme',
    },
    {
      value: 'system',
      label: t('settings.theme.system'),
      icon: Monitor,
      description: 'Follow system preference',
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-purple-800 text-xl">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
            <Palette className="w-5 h-5 text-white" />
          </div>
          {t('settings.theme.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={settings.theme}
          onValueChange={handleThemeChange}
          className="space-y-4"
        >
          {themeOptions.map((option) => {
            const IconComponent = option.icon;
            const isSelected = settings.theme === option.value;
            return (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label
                  htmlFor={option.value}
                  className={`flex items-center gap-4 cursor-pointer flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected 
                      ? 'border-purple-400 bg-purple-50 shadow-md' 
                      : 'border-purple-200 hover:bg-purple-50 hover:border-purple-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${isSelected ? 'text-purple-900' : 'text-purple-800'}`}>
                      {option.label}
                    </div>
                    <div className={`text-sm ${isSelected ? 'text-purple-700' : 'text-purple-600'}`}>
                      {option.description}
                    </div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
