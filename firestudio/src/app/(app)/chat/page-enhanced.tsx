// ============================================================================
// ENHANCED MULTI-LANGUAGE CHAT PAGE
// Advanced voice chat with multi-language support and real-time translation
// ============================================================================

"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Languages, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { LanguageSelector } from '@/components/language-selector';
import { VoiceControls, useSpeech } from '@/components/voice-controls';
import { SpeechResult, TranslationService } from '@/lib/multi-language-voice';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  language?: string;
  originalText?: string;
  isTranslated?: boolean;
  audioUrl?: string;
}

interface ChatSettings {
  autoTranslate: boolean;
  autoSpeak: boolean;
  showOriginalText: boolean;
  voiceEnabled: boolean;
}

export default function ChatPage() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const { speak, stop } = useSpeech();
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Voice and translation state
  const [settings, setSettings] = useState<ChatSettings>({
    autoTranslate: true,
    autoSpeak: false,
    showOriginalText: false,
    voiceEnabled: true
  });
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const translationService = useRef(new TranslationService());

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Create welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: t.chatWelcome || 'Hello! I\'m your AI farming assistant. How can I help you today?',
        sender: 'assistant',
        timestamp: new Date(),
        language
      };
      setMessages([welcomeMessage]);
    }
  }, [language, t, messages.length]);

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      language
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send message to chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          language,
          history: messages.slice(-5) // Send last 5 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      let assistantContent = data.response;

      // Translate response if needed
      if (settings.autoTranslate && data.detectedLanguage !== language) {
        try {
          assistantContent = await translationService.current.translateText(
            assistantContent, 
            language, 
            data.detectedLanguage || 'en'
          );
        } catch (error) {
          console.warn('Translation failed:', error);
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: assistantContent,
        sender: 'assistant',
        timestamp: new Date(),
        language,
        originalText: data.response !== assistantContent ? data.response : undefined,
        isTranslated: data.response !== assistantContent
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-speak response if enabled
      if (settings.autoSpeak && settings.voiceEnabled) {
        handleSpeakMessage(assistantMessage);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle voice input result
  const handleSpeechResult = async (result: SpeechResult) => {
    setInputValue(result.transcript);
    
    // Auto-submit if we have high confidence
    if (result.confidence > 0.8) {
      // Small delay to show the recognized text
      setTimeout(() => handleSubmit(), 500);
    }

    toast({
      title: 'Voice Input',
      description: `Recognized: "${result.transcript}"`,
      duration: 3000
    });
  };

  // Handle speaking a message
  const handleSpeakMessage = async (message: Message) => {
    if (isSpeaking) {
      stop();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      await speak(message.content);
    } catch (error) {
      console.error('TTS error:', error);
      toast({
        title: 'Speech Error',
        description: 'Failed to speak the message.',
        variant: 'destructive'
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  // Handle language change
  const handleLanguageChange = async (newLanguage: string) => {
    // Translate existing messages if auto-translate is enabled
    if (settings.autoTranslate && messages.length > 1) {
      setIsLoading(true);
      try {
        const translatedMessages = await Promise.all(
          messages.map(async (msg) => {
            if (msg.sender === 'assistant' && msg.language !== newLanguage) {
              try {
                const translatedContent = await translationService.current.translateText(
                  msg.content,
                  newLanguage,
                  msg.language || 'en'
                );
                return {
                  ...msg,
                  content: translatedContent,
                  originalText: msg.content,
                  language: newLanguage,
                  isTranslated: true
                };
              } catch {
                return msg; // Keep original on translation failure
              }
            }
            return msg;
          })
        );
        setMessages(translatedMessages);
      } catch (error) {
        console.error('Batch translation failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Update settings
  const updateSetting = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with Language Selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title={t.chatAssistant || 'AI Chat Assistant'}
            subtitle={t.chatDescription || 'Get farming advice and support in your language'}
          />
          <div className="flex items-center space-x-4">
            <LanguageSelector
              onLanguageChange={handleLanguageChange}
              compact={true}
              className="min-w-[120px]"
            />
          </div>
        </div>

        {/* Chat Settings */}
        <Card className="mt-4 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-translate"
                checked={settings.autoTranslate}
                onCheckedChange={(checked) => updateSetting('autoTranslate', checked)}
              />
              <Label htmlFor="auto-translate" className="text-sm">
                <Globe className="h-3 w-3 inline mr-1" />
                {t.autoTranslate || 'Auto Translate'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-speak"
                checked={settings.autoSpeak}
                onCheckedChange={(checked) => updateSetting('autoSpeak', checked)}
                disabled={!settings.voiceEnabled}
              />
              <Label htmlFor="auto-speak" className="text-sm">
                {t.autoSpeak || 'Auto Speak'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-original"
                checked={settings.showOriginalText}
                onCheckedChange={(checked) => updateSetting('showOriginalText', checked)}
              />
              <Label htmlFor="show-original" className="text-sm">
                {t.showOriginal || 'Show Original'}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="voice-enabled"
                checked={settings.voiceEnabled}
                onCheckedChange={(checked) => updateSetting('voiceEnabled', checked)}
              />
              <Label htmlFor="voice-enabled" className="text-sm">
                {t.voiceEnabled || 'Voice Enabled'}
              </Label>
            </div>
          </div>
        </Card>
      </div>

      {/* Chat Messages */}
      <Card className="mb-4 h-[500px] flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-3",
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.sender === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3 relative group",
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  )}
                >
                  {/* Message Content */}
                  <div className="text-sm leading-relaxed">
                    {message.content}
                  </div>

                  {/* Original Text (if translated) */}
                  {message.isTranslated && settings.showOriginalText && message.originalText && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <div className="text-xs text-muted-foreground flex items-center space-x-1">
                        <Languages className="h-3 w-3" />
                        <span>{t.original || 'Original'}:</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 italic">
                        {message.originalText}
                      </div>
                    </div>
                  )}

                  {/* Message Metadata */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      {message.isTranslated && (
                        <Badge variant="secondary" className="text-xs">
                          <Languages className="h-2 w-2 mr-1" />
                          {t.translated || 'Translated'}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Speak Button */}
                    {message.sender === 'assistant' && settings.voiceEnabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSpeakMessage(message)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        disabled={isSpeaking}
                      >
                        {isSpeaking ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {message.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {t.thinking || 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex items-end space-x-2">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t.typeMessage || 'Type your message...'}
                disabled={isLoading}
                className="min-h-[40px] resize-none"
              />
            </div>
            
            {/* Voice Controls */}
            {settings.voiceEnabled && (
              <VoiceControls
                onSpeechResult={handleSpeechResult}
                onSpeechStart={() => setInputValue('')}
                disabled={isLoading}
                showAdvancedControls={true}
                className="flex-shrink-0"
              />
            )}

            {/* Send Button */}
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="px-3"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Help Text */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          {t.chatHelp || 'Ask questions about farming, crops, weather, diseases, or government schemes. You can type or use voice input in any supported language.'}
        </p>
      </div>
    </div>
  );
}
