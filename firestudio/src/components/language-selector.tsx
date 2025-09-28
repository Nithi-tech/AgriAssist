// ============================================================================
// LANGUAGE SELECTOR COMPONENT
// Dropdown for selecting language with native names and voice preview
// ============================================================================

"use client";

import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/use-language';
import { languages } from '@/lib/i18n';
import i18n from '@/lib/i18n';
import { LANGUAGE_CONFIGS } from '@/lib/multi-language-voice';

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
  className?: string;
  showVoicePreview?: boolean;
  compact?: boolean;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  supported: boolean;
  hasSTT: boolean;
  hasTTS: boolean;
}

// Language options with comprehensive support information
const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', supported: true, hasSTT: true, hasTTS: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', supported: true, hasSTT: true, hasTTS: true },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', supported: true, hasSTT: true, hasTTS: true },
  { code: 'en', name: 'English', nativeName: 'English', flag: '��', supported: true, hasSTT: true, hasTTS: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', supported: true, hasSTT: true, hasTTS: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', supported: true, hasSTT: true, hasTTS: true },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳', supported: true, hasSTT: true, hasTTS: true }
];

export function LanguageSelector({ 
  onLanguageChange, 
  className = "", 
  showVoicePreview = true,
  compact = false 
}: LanguageSelectorProps) {
  const { t: i18nT } = useTranslation('common');
  const { language, setLanguage } = useLanguage();
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const currentLanguage = LANGUAGE_OPTIONS.find(lang => lang.code === language) || LANGUAGE_OPTIONS[0];

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      // Update i18next language
      await i18n.changeLanguage(languageCode);
      
      // Update language provider state  
      setLanguage(languageCode as any);
      
      // Call optional callback
      onLanguageChange?.(languageCode);
      
      console.log(`Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const playVoicePreview = (languageCode: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isPreviewPlaying === languageCode) {
      // Stop current preview
      window.speechSynthesis.cancel();
      setIsPreviewPlaying(null);
      return;
    }

    // Find the best voice for this language
    const langConfig = LANGUAGE_CONFIGS[languageCode as keyof typeof LANGUAGE_CONFIGS];
    if (!langConfig) return;

    const targetLang = langConfig.ttsLang;
    const voice = availableVoices.find(v => 
      v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0])
    );

    if (!voice) return;

    // Create preview text
    const previewTexts: Record<string, string> = {
      'en': 'Hello! I am your AI assistant.',
      'hi': 'नमस्ते! मैं आपका एआई सहायक हूं।',
      'ta': 'வணக்கம்! நான் உங்கள் AI உதவியாளர்.',
      'te': 'నమస్కారం! నేను మీ AI సహాయకుడిని.',
      'ml': 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AI സഹായകനാണ്.',
      'kn': 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಸಹಾಯಕ.',
      'gu': 'નમસ્તે! હું તમારો AI સહાયક છું.',
      'bn': 'নমস্কার! আমি আপনার AI সহায়ক।',
      'mr': 'नमस्कार! मी तुमचा AI सहायक आहे.',
      'ur': 'السلام علیکم! میں آپ کا AI معاون ہوں۔'
    };

    const utterance = new SpeechSynthesisUtterance(previewTexts[languageCode] || previewTexts['en']);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    setIsPreviewPlaying(languageCode);
    
    utterance.onend = () => setIsPreviewPlaying(null);
    utterance.onerror = () => setIsPreviewPlaying(null);
    
    window.speechSynthesis.speak(utterance);
  };

  const getVoiceSupport = (languageCode: string) => {
    const langConfig = LANGUAGE_CONFIGS[languageCode as keyof typeof LANGUAGE_CONFIGS];
    if (!langConfig) return { hasSTT: false, hasTTS: false };

    const targetLang = langConfig.ttsLang;
    const hasVoice = availableVoices.some(voice => 
      voice.lang === targetLang || voice.lang.startsWith(targetLang.split('-')[0])
    );

    return {
      hasSTT: true, // Most browsers support STT for these languages
      hasTTS: hasVoice
    };
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={`${className}`}>
            <span className="mr-2">{currentLanguage.flag}</span>
            <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
            <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
            <ChevronDown className="ml-2 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
          {LANGUAGE_OPTIONS.map((lang) => {
            const support = getVoiceSupport(lang.code);
            return (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{lang.name}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {showVoicePreview && support.hasTTS && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => playVoicePreview(lang.code, e)}
                      className="h-6 w-6 p-0"
                    >
                      {isPreviewPlaying === lang.code ? (
                        <VolumeX className="h-3 w-3" />
                      ) : (
                        <Volume2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  {language === lang.code && <Check className="h-4 w-4 text-primary" />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`min-w-[200px] justify-between ${className}`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentLanguage.flag}</span>
            <div className="flex flex-col items-start">
              <span className="font-medium">{currentLanguage.nativeName}</span>
              <span className="text-xs text-muted-foreground">{currentLanguage.name}</span>
            </div>
          </div>
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
        <div className="p-2">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">
            {i18nT('select_language', 'Select Language')}
          </h3>
          
          {/* Supported Languages */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground px-2 py-1">
              {i18nT('fully_supported', 'Fully Supported')}
            </div>
            {LANGUAGE_OPTIONS.filter(lang => lang.supported).map((lang) => {
              const support = getVoiceSupport(lang.code);
              return (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{lang.flag}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{lang.nativeName}</span>
                        {support.hasSTT && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            STT
                          </Badge>
                        )}
                        {support.hasTTS && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            TTS
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{lang.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {showVoicePreview && support.hasTTS && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => playVoicePreview(lang.code, e)}
                        className="h-7 w-7 p-0 hover:bg-muted"
                        title={i18nT('preview_voice', 'Preview Voice')}
                      >
                        {isPreviewPlaying === lang.code ? (
                          <VolumeX className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    {language === lang.code && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>

          {/* Coming Soon Languages */}
          <div className="space-y-1 mt-4 pt-2 border-t">
            <div className="text-xs text-muted-foreground px-2 py-1">
              {i18nT('coming_soon', 'Coming Soon')}
            </div>
            {LANGUAGE_OPTIONS.filter(lang => !lang.supported).map((lang) => (
              <div
                key={lang.code}
                className="flex items-center justify-between p-3 opacity-50 cursor-not-allowed rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{lang.name}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {i18nT('soon', 'Soon')}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook for voice-enabled language selection
export function useVoiceLanguageSelector() {
  const { language } = useLanguage();
  const [voiceSupport, setVoiceSupport] = useState({ hasSTT: false, hasTTS: false });

  useEffect(() => {
    const checkVoiceSupport = () => {
      const langConfig = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS];
      if (!langConfig) {
        setVoiceSupport({ hasSTT: false, hasTTS: false });
        return;
      }

      const voices = window.speechSynthesis.getVoices();
      const targetLang = langConfig.ttsLang;
      const hasVoice = voices.some(voice => 
        voice.lang === targetLang || voice.lang.startsWith(targetLang.split('-')[0])
      );

      setVoiceSupport({
        hasSTT: true, // Most browsers support STT for supported languages
        hasTTS: hasVoice
      });
    };

    checkVoiceSupport();
    window.speechSynthesis.onvoiceschanged = checkVoiceSupport;
  }, [language]);

  return {
    language,
    voiceSupport,
    langConfig: LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS]
  };
}
