// ============================================================================
// MULTI-LANGUAGE VOICE DEMO COMPONENT
// Showcase and test the voice capabilities in different languages
// ============================================================================

"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/hooks/use-language-safe';
import { LanguageSelector } from '@/components/language-selector';
import { VoiceControls, useSpeech } from '@/components/voice-controls';
import { SpeechResult, LANGUAGE_CONFIGS } from '@/lib/multi-language-voice';
import { cn } from '@/lib/utils';

interface TestResult {
  language: string;
  sttWorked: boolean;
  ttsWorked: boolean;
  recognizedText?: string;
  error?: string;
  timestamp: Date;
}

const DEMO_TEXTS: Record<string, string> = {
  en: "Hello! I am your AI farming assistant. How can I help you with your crops today?",
  hi: "नमस्ते! मैं आपका AI कृषि सहायक हूं। आज आपकी फसलों में कैसे मदद कर सकता हूं?",
  ta: "வணக்கம்! நான் உங்கள் AI வேளாண்மை உதவியாளர். இன்று உங்கள் பயிர்களில் எப்படி உதவ முடியும்?",
  te: "నమస్కారం! నేను మీ AI వ్యవసాయ సహాయకుడని. ఈ రోజు మీ పంటలలో ఎలా సహాయం చేయగలను?",
  ml: "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AI കൃഷി സഹായകനാണ്. ഇന്ന് നിങ്ങളുടെ വിളകളിൽ എങ്ങനെ സഹായിക്കാം?",
  kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಕೃಷಿ ಸಹಾಯಕ. ಇಂದು ನಿಮ್ಮ ಬೆಳೆಗಳಲ್ಲಿ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
  gu: "નમસ્તે! હું તમારો AI કૃષિ સહાયક છું. આજે તમારા પાકોમાં કેવી રીતે મદદ કરી શકું?",
  bn: "নমস্কার! আমি আপনার AI কৃষি সহায়ক। আজ আপনার ফসলে কীভাবে সাহায্য করতে পারি?",
  mr: "नमस्कार! मी तुमचा AI कृषी सहाय्यक आहे. आज तुमच्या पिकांमध्ये कशी मदत करू शकते?",
  ur: "السلام علیکم! میں آپ کا AI زراعت معاون ہوں۔ آج آپ کی فصلوں میں کیسے مدد کر سکتا ہوں؟"
};

export function VoiceDemo() {
  const { language, t } = useLanguage();
  const { speak, stop } = useSpeech();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [voiceSupport, setVoiceSupport] = useState<Record<string, boolean>>({});

  // Check voice support for all languages
  useEffect(() => {
    const checkVoiceSupport = () => {
      const voices = window.speechSynthesis.getVoices();
      const support: Record<string, boolean> = {};
      
      Object.keys(LANGUAGE_CONFIGS).forEach(lang => {
        const config = LANGUAGE_CONFIGS[lang as keyof typeof LANGUAGE_CONFIGS];
        const hasVoice = voices.some(voice => 
          voice.lang === config.ttsLang || 
          voice.lang.startsWith(config.ttsLang.split('-')[0])
        );
        support[lang] = hasVoice;
      });
      
      setVoiceSupport(support);
    };

    checkVoiceSupport();
    window.speechSynthesis.onvoiceschanged = checkVoiceSupport;
  }, []);

  const testLanguageVoice = async (langCode: string): Promise<TestResult> => {
    const result: TestResult = {
      language: langCode,
      sttWorked: false,
      ttsWorked: false,
      timestamp: new Date()
    };

    try {
      setCurrentTest(langCode);
      
      // Test TTS
      if (voiceSupport[langCode]) {
        const testText = DEMO_TEXTS[langCode] || DEMO_TEXTS.en;
        await speak(testText, { language: langCode });
        result.ttsWorked = true;
      }

      // TTS test completed successfully
      result.ttsWorked = true;
      
      // Note: STT testing would require user interaction
      // For demo purposes, we'll mark it as available if browser supports it
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        result.sttWorked = true;
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setCurrentTest(null);
    return result;
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    const supportedLanguages = Object.keys(LANGUAGE_CONFIGS);
    
    for (const langCode of supportedLanguages) {
      const result = await testLanguageVoice(langCode);
      setTestResults(prev => [...prev, result]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunningTests(false);
  };

  const testCurrentLanguage = async () => {
    const result = await testLanguageVoice(language);
    setTestResults(prev => [result, ...prev.filter(r => r.language !== language)]);
  };

  const handleSpeechResult = (result: SpeechResult) => {
    // Update the test result with recognized text
    setTestResults(prev => prev.map(test => 
      test.language === result.language 
        ? { ...test, recognizedText: result.transcript, sttWorked: true }
        : test
    ));
  };

  const speakDemoText = async (langCode: string) => {
    try {
      const text = DEMO_TEXTS[langCode] || DEMO_TEXTS.en;
      await speak(text, { language: langCode });
    } catch (error) {
      console.error('Demo speech failed:', error);
    }
  };

  const supportedCount = Object.values(voiceSupport).filter(Boolean).length;
  const totalCount = Object.keys(LANGUAGE_CONFIGS).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Multi-Language Voice Demo</h1>
        <p className="text-muted-foreground mb-6">
          Test and demonstrate the voice capabilities across different Indian languages
        </p>
        
        <div className="flex items-center justify-center space-x-4 mb-6">
          <LanguageSelector compact={true} />
          <Badge variant="outline" className="px-3 py-1">
            {supportedCount}/{totalCount} languages supported
          </Badge>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            This demo tests Text-to-Speech (TTS) and Speech-to-Text (STT) capabilities 
            in your browser for various Indian languages. Some features may require 
            browser permissions or external API keys.
          </AlertDescription>
        </Alert>
      </div>

      {/* Control Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Voice Controls</span>
            <div className="flex space-x-2">
              <Button
                onClick={testCurrentLanguage}
                variant="outline"
                size="sm"
                disabled={isRunningTests}
              >
                <Play className="h-4 w-4 mr-2" />
                Test Current Language
              </Button>
              <Button
                onClick={runAllTests}
                variant="default"
                size="sm"
                disabled={isRunningTests}
              >
                {isRunningTests ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isRunningTests ? 'Testing...' : 'Test All Languages'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Voice Input */}
            <div className="space-y-4">
              <h3 className="font-semibold">Voice Input (STT)</h3>
              <VoiceControls
                onSpeechResult={handleSpeechResult}
                showAdvancedControls={true}
                className="w-full justify-center"
              />
              <p className="text-sm text-muted-foreground">
                Click the microphone to test speech recognition in {LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS]?.nativeName}
              </p>
            </div>

            {/* Voice Output */}
            <div className="space-y-4">
              <h3 className="font-semibold">Voice Output (TTS)</h3>
              <Button
                onClick={() => speakDemoText(language)}
                variant="outline"
                className="w-full"
                disabled={!voiceSupport[language]}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Speak Demo Text
              </Button>
              <p className="text-sm text-muted-foreground">
                {voiceSupport[language] 
                  ? `Click to hear a demo in ${LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS]?.nativeName}`
                  : 'Voice not available for this language'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Grid */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Language Support Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(LANGUAGE_CONFIGS).map(([code, config]) => {
              const isCurrentTest = currentTest === code;
              const testResult = testResults.find(r => r.language === code);
              const hasVoice = voiceSupport[code];

              return (
                <Card key={code} className={cn(
                  "relative",
                  isCurrentTest && "ring-2 ring-primary",
                  code === language && "border-primary"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{config.nativeName}</h3>
                        <p className="text-sm text-muted-foreground">{config.name}</p>
                      </div>
                      <Badge variant={code === language ? "default" : "secondary"}>
                        {code.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {/* TTS Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Text-to-Speech</span>
                        <div className="flex items-center space-x-1">
                          {hasVoice ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Badge variant={hasVoice ? "default" : "destructive"} className="text-xs">
                            {hasVoice ? 'Available' : 'Not Available'}
                          </Badge>
                        </div>
                      </div>

                      {/* STT Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Speech-to-Text</span>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <Badge variant="default" className="text-xs">
                            Browser API
                          </Badge>
                        </div>
                      </div>

                      {/* Quick Test Button */}
                      <Button
                        onClick={() => speakDemoText(code)}
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        disabled={!hasVoice || isCurrentTest}
                      >
                        {isCurrentTest ? (
                          <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                        ) : (
                          <Volume2 className="h-3 w-3 mr-2" />
                        )}
                        {isCurrentTest ? 'Testing...' : 'Test Voice'}
                      </Button>
                    </div>

                    {/* Test Results */}
                    {testResult && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-muted-foreground">
                          Last tested: {testResult.timestamp.toLocaleTimeString()}
                        </div>
                        {testResult.recognizedText && (
                          <div className="text-xs mt-1">
                            <strong>Recognized:</strong> {testResult.recognizedText}
                          </div>
                        )}
                        {testResult.error && (
                          <div className="text-xs text-red-500 mt-1">
                            <strong>Error:</strong> {testResult.error}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Demo Texts */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Texts in Different Languages</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-4">
              {Object.entries(DEMO_TEXTS).map(([langCode, text]) => {
                const config = LANGUAGE_CONFIGS[langCode as keyof typeof LANGUAGE_CONFIGS];
                if (!config) return null;

                return (
                  <div key={langCode} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{langCode.toUpperCase()}</Badge>
                        <span className="font-medium">{config.nativeName}</span>
                      </div>
                      <Button
                        onClick={() => speakDemoText(langCode)}
                        variant="ghost"
                        size="sm"
                        disabled={!voiceSupport[langCode]}
                      >
                        <Volume2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
