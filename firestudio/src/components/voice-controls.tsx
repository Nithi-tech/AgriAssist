// ============================================================================
// ENHANCED VOICE CONTROLS COMPONENT
// Advanced voice input/output controls with multi-language support
// ============================================================================

"use client";

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Loader2, 
  Settings,
  Headphones,
  RadioIcon,
  Languages,
  Square
} from 'lucide-react';
import { getVoiceSettings, addNaturalPauses } from '@/lib/voice-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/hooks/use-language';
import { 
  MultiLanguageVoiceService, 
  VoiceConfig, 
  SpeechResult, 
  VoiceOptions,
  LANGUAGE_CONFIGS 
} from '@/lib/multi-language-voice';

interface VoiceControlsProps {
  onSpeechResult?: (result: SpeechResult) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onStopSpeaking?: () => void;
  isSpeaking?: boolean;
  disabled?: boolean;
  className?: string;
  showAdvancedControls?: boolean;
}

interface VoiceSettings {
  sttProvider: 'browser' | 'google-cloud' | 'whisper' | 'azure';
  ttsProvider: 'browser' | 'google-cloud' | 'azure' | 'elevenlabs';
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
}

export function VoiceControls({
  onSpeechResult,
  onSpeechStart,
  onSpeechEnd,
  onSpeakStart,
  onSpeakEnd,
  onStopSpeaking,
  isSpeaking = false,
  disabled = false,
  className = "",
  showAdvancedControls = false
}: VoiceControlsProps) {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechText, setSpeechText] = useState('');
  
  const voiceServiceRef = useRef<MultiLanguageVoiceService | null>(null);
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Voice settings optimized for clarity and speed
  const [settings, setSettings] = useState<VoiceSettings>({
    sttProvider: 'browser',
    ttsProvider: 'browser',
    voiceName: '',
    rate: 0.95, // Slightly slower for clarity
    pitch: 1.05, // Slightly higher for better articulation
    volume: 1
  });

  // Initialize voice service with language-specific settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const voiceSettings = getVoiceSettings(language);
        const config: VoiceConfig = {
          sttProvider: settings.sttProvider,
          ttsProvider: settings.ttsProvider,
          language: voiceSettings.language,
          voiceName: settings.voiceName,
          rate: voiceSettings.rate,
          pitch: voiceSettings.pitch,
          volume: settings.volume
        };

        voiceServiceRef.current = new MultiLanguageVoiceService(config);
        
        return () => {
          voiceServiceRef.current?.stopListening();
          voiceServiceRef.current?.stopSpeaking();
        };
      } catch (error) {
        console.error('Voice initialization error:', error);
        setError(error instanceof Error ? error.message : 'Voice initialization failed');
      }
    }
  }, [language, settings]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Auto-select best voice for current language
      if (voiceServiceRef.current && !settings.voiceName) {
        const langVoices = voiceServiceRef.current.getAvailableVoicesForLanguage(language);
        if (langVoices.length > 0) {
          setSettings(prev => ({ ...prev, voiceName: langVoices[0].name }));
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [language, settings.voiceName]);

  // Update voice service when settings change
  useEffect(() => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.updateConfig({
        sttProvider: settings.sttProvider,
        ttsProvider: settings.ttsProvider,
        language,
        voiceName: settings.voiceName,
        rate: settings.rate,
        pitch: settings.pitch,
        volume: settings.volume
      });
    }
  }, [settings, language]);

  // Handle speech recognition
  const startListening = async () => {
    if (!voiceServiceRef.current || disabled || isListening) return;

    try {
      setIsListening(true);
      setIsLoading(true);
      setError(null);
      setSpeechText('');
      onSpeechStart?.();

      // Add a recognition timeout for better UX
      const recognitionTimeout = setTimeout(() => {
        if (isListening) {
          voiceServiceRef.current?.stopListening();
          setError('Speech recognition timeout. Please try again.');
          setIsListening(false);
          setIsLoading(false);
          onSpeechEnd?.();
        }
      }, 12000); // 12 second timeout

      const result = await voiceServiceRef.current.startListening();
      clearTimeout(recognitionTimeout);
      
      if (result && result.transcript && result.transcript.trim().length > 0) {
        setSpeechText(result.transcript);
        onSpeechResult?.(result);
      } else {
        setError('No speech detected. Please speak clearly and try again.');
      }

    } catch (error) {
      console.error('Speech recognition failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Speech recognition failed';
      if (error instanceof Error) {
        if (error.message.includes('permission') || error.message.includes('denied')) {
          errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
        } else if (error.message.includes('not supported')) {
          errorMessage = 'Speech recognition is not supported in your browser.';
        } else if (error.message.includes('no-speech') || error.message.includes('No speech detected')) {
          errorMessage = 'No speech detected. Please speak closer to the microphone and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Recognition timeout. Please try speaking again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsListening(false);
      setIsLoading(false);
      onSpeechEnd?.();
    }
  };

  const stopListening = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopListening();
    }
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }
    setIsListening(false);
    setIsLoading(false);
    onSpeechEnd?.();
  };

  // Handle text-to-speech
  const speakText = async (text: string, options?: Partial<VoiceOptions>) => {
    if (!voiceServiceRef.current || !text.trim() || isSpeaking) return;

    try {
      onSpeakStart?.();

      // Add natural pauses based on language
      const processedText = addNaturalPauses(text, language.split('-')[0] as any);
      
      const voiceSettings = getVoiceSettings(language);
      const voiceOptions: VoiceOptions = {
        text: processedText,
        language: voiceSettings.language,
        voiceName: settings.voiceName,
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
        volume: settings.volume,
        ...options
      };

      await voiceServiceRef.current.speak(voiceOptions);

    } catch (error) {
      console.error('Text-to-speech failed:', error);
      setError(error instanceof Error ? error.message : 'Text-to-speech failed');
    } finally {
      onSpeakEnd?.();
    }
  };

  const stopSpeaking = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopSpeaking();
    }
    onSpeakEnd?.();
  };

  // Get language-specific voices
  const getLanguageVoices = () => {
    const langConfig = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS];
    if (!langConfig) return [];

    const targetLang = langConfig.ttsLang;
    const langFamily = targetLang.split('-')[0];

    return availableVoices.filter(voice => 
      voice.lang === targetLang || voice.lang.startsWith(langFamily)
    );
  };

  // Voice quality indicator
  const getVoiceQuality = (voice: SpeechSynthesisVoice) => {
    if (voice.name.includes('Neural') || voice.name.includes('Wavenet')) return 'premium';
    if (voice.name.includes('Standard')) return 'standard';
    return 'basic';
  };

  const languageVoices = getLanguageVoices();
  const hasVoiceSupport = languageVoices.length > 0;
  const langConfig = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Main Voice Controls */}
      <div className="flex items-center space-x-1">
        {/* Speech Recognition/Stop Button */}
        <Button
          variant={isListening ? "default" : isSpeaking ? "destructive" : "outline"}
          size="sm"
          onClick={isSpeaking ? onStopSpeaking : (isListening ? stopListening : startListening)}
          disabled={disabled || isLoading}
          className="relative"
          title={isSpeaking ? "Stop AI Speech" : isListening ? "Stop Listening" : "Start Voice Input"}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSpeaking ? (
            <Square className="h-4 w-4" />
          ) : isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          
          {isListening && (
            <div className="absolute -top-1 -right-1">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            </div>
          )}
        </Button>

        {/* Voice Settings Popover */}
        {showAdvancedControls && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{t.voiceSettings}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {langConfig?.nativeName || language}
                  </Badge>
                </div>

                {/* Voice Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t.voice}</Label>
                  <Select
                    value={settings.voiceName}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, voiceName: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.selectVoice} />
                    </SelectTrigger>
                    <SelectContent>
                      {languageVoices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{voice.name}</span>
                            <div className="flex items-center space-x-1 ml-2">
                              {getVoiceQuality(voice) === 'premium' && (
                                <Badge variant="secondary" className="text-xs">Premium</Badge>
                              )}
                              {voice.localService && <Headphones className="h-3 w-3" />}
                              {!voice.localService && <RadioIcon className="h-3 w-3" />}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice Parameters */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm">{t.speed}: {settings.rate.toFixed(1)}x</Label>
                    <Slider
                      value={[settings.rate]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, rate: value }))}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">{t.pitch}: {settings.pitch.toFixed(1)}</Label>
                    <Slider
                      value={[settings.pitch]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, pitch: value }))}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">{t.volume}: {Math.round(settings.volume * 100)}%</Label>
                    <Slider
                      value={[settings.volume]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, volume: value }))}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Provider Selection */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-2">
                    <Label className="text-sm">STT {t.provider}</Label>
                    <Select
                      value={settings.sttProvider}
                      onValueChange={(value: VoiceSettings['sttProvider']) => 
                        setSettings(prev => ({ ...prev, sttProvider: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="browser">Browser API</SelectItem>
                        <SelectItem value="google-cloud">Google Cloud</SelectItem>
                        <SelectItem value="azure">Azure Speech</SelectItem>
                        <SelectItem value="whisper">OpenAI Whisper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">TTS {t.provider}</Label>
                    <Select
                      value={settings.ttsProvider}
                      onValueChange={(value: VoiceSettings['ttsProvider']) => 
                        setSettings(prev => ({ ...prev, ttsProvider: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="browser">Browser API</SelectItem>
                        <SelectItem value="google-cloud">Google Cloud</SelectItem>
                        <SelectItem value="azure">Azure Speech</SelectItem>
                        <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-2">
        {/* Language Indicator */}
        <Badge variant="outline" className="text-xs px-2 py-1">
          <Languages className="h-3 w-3 mr-1" />
          {langConfig?.nativeName || language}
        </Badge>

        {/* Voice Support Indicators */}
        {hasVoiceSupport && (
          <Badge variant="secondary" className="text-xs">
            TTS
          </Badge>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="absolute top-full mt-2 right-0 z-50 w-64">
          <CardContent className="p-3">
            <div className="text-sm text-destructive">
              <strong>Error:</strong> {error}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="mt-2 w-full"
            >
              {t.dismiss}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Speech Text Display */}
      {speechText && (
        <Card className="absolute top-full mt-2 right-0 z-50 w-64">
          <CardContent className="p-3">
            <div className="text-sm">
              <strong>{t.recognized}:</strong> {speechText}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export the speak function for use in other components
export function useSpeech() {
  const { language } = useLanguage();
  const voiceServiceRef = useRef<MultiLanguageVoiceService | null>(null);

  useEffect(() => {
    const config: VoiceConfig = {
      sttProvider: 'browser',
      ttsProvider: 'browser',
      language
    };
    voiceServiceRef.current = new MultiLanguageVoiceService(config);
  }, [language]);

  const speak = async (text: string, options?: Partial<VoiceOptions>) => {
    if (voiceServiceRef.current) {
      await voiceServiceRef.current.speak({
        text,
        language,
        ...options
      });
    }
  };

  const stop = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopSpeaking();
    }
  };

  return { speak, stop };
}
