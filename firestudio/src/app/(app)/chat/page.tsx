"use client";

// Force dynamic rendering to ensure secure API calls
export const dynamic = 'force-dynamic';

// ============================================================================
// ENHANCED MULTI-LANGUAGE CHAT PAGE
// Advanced voice chat with multi-language support and real-time translation
// ============================================================================

import { ClientOnly } from '@/components/client-only';
import { generateMessageId } from '@/utils/message-utils';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  Bot, 
  Loader2, 
  Languages, 
  Globe, 
  MessageCircle,
  Sparkles,
  Mic,
  Volume2,
  Settings,
  Leaf,
  Brain,
  Heart,
  Sun,
  Crop,
  Square
} from 'lucide-react';
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
import { LanguageSelector } from '@/components/language-selector';
import { VoiceControls, useSpeech } from '@/components/voice-controls';
import { SpeechResult, TranslationService } from '@/lib/multi-language-voice';
import { translateResponse } from '@/utils/translateResponse';
import { type Language } from '@/providers/language-provider';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  language?: Language;
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

  // Create welcome message with language support
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        content: t.chatWelcome || 'Hello! I\'m your AI farming assistant. How can I help you today?',
        sender: 'assistant',
        timestamp: new Date(),
        language: language as Language
      };
      setMessages([welcomeMessage]);
    }
  }, [language, t, messages.length]);

  // Handle form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: generateMessageId(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      language: language as Language
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

      // Translate response if needed and language is supported
      if (settings.autoTranslate && data.detectedLanguage !== language) {
        try {
          // Use our new translateResponse utility with language validation
          assistantContent = await translateResponse(assistantContent, language);
        } catch (error) {
          console.warn('Translation failed:', error);
          // Fallback to original content if translation fails
        }
      }

      const assistantMessage: Message = {
        id: generateMessageId(),
        content: assistantContent,
        sender: 'assistant',
        timestamp: new Date(),
        language: language as Language,
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

  // Handle stopping AI speech
  const handleStopSpeaking = () => {
    stop();
    setIsSpeaking(false);
  };

  // Handle language change
  const handleLanguageChange = async (languageCode: string) => {
    const newLanguage = languageCode as Language;
    // Translate existing messages if auto-translate is enabled
    if (settings.autoTranslate && messages.length > 1) {
      setIsLoading(true);
      try {
        const translatedMessages = await Promise.all(
          messages.map(async (msg) => {
            if (msg.sender === 'assistant' && msg.language !== newLanguage) {
              try {
                // Use our new translateResponse utility
                const translatedContent = await translateResponse(msg.content, newLanguage);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 rounded-full mb-6 shadow-xl">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-700 via-blue-700 to-purple-700 bg-clip-text text-transparent mb-4">
            🤖 {t.aiFarmingAssistant || 'AI Farming Assistant'}
          </h1>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            {t.chatPageDescription || 'Your intelligent farming companion powered by advanced AI. Get expert advice, crop recommendations, disease diagnosis, and farming tips in your preferred language.'}
          </p>
          <div className="flex justify-center items-center gap-2 mt-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="text-gray-600 font-medium">{t.available24x7 || 'Available 24/7 in multiple languages'}</span>
            <Heart className="h-5 w-5 text-red-500" />
          </div>
        </div>

        {/* Settings and Language Selector */}
        <Card className="mb-8 bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{t.chatSettings || 'Chat Settings'}</h3>
                  <p className="text-gray-600">{t.customizeExperience || 'Customize your AI assistant experience'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <LanguageSelector
                  onLanguageChange={handleLanguageChange}
                  compact={false}
                  className="min-w-[150px] h-12"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="auto-translate" className="text-sm font-semibold text-green-800 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t.autoTranslate || 'Auto Translate'}
                  </Label>
                  <Switch
                    id="auto-translate"
                    checked={settings.autoTranslate}
                    onCheckedChange={(checked) => updateSetting('autoTranslate', checked)}
                  />
                </div>
                <p className="text-xs text-green-600">{t.autoTranslateDescription || 'Automatically translate messages'}</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="auto-speak" className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    {t.autoSpeak || 'Auto Speak'}
                  </Label>
                  <Switch
                    id="auto-speak"
                    checked={settings.autoSpeak}
                    onCheckedChange={(checked) => updateSetting('autoSpeak', checked)}
                    disabled={!settings.voiceEnabled}
                  />
                </div>
                <p className="text-xs text-blue-600">{t.autoSpeakDescription || 'Read responses aloud'}</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="voice-enabled" className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    {t.voiceInput || 'Voice Input'}
                  </Label>
                  <Switch
                    id="voice-enabled"
                    checked={settings.voiceEnabled}
                    onCheckedChange={(checked) => updateSetting('voiceEnabled', checked)}
                  />
                </div>
                <p className="text-xs text-purple-600">{t.voiceInputDescription || 'Enable voice commands'}</p>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="show-original" className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    {t.showOriginal || 'Show Original'}
                  </Label>
                  <Switch
                    id="show-original"
                    checked={settings.showOriginalText}
                    onCheckedChange={(checked) => updateSetting('showOriginalText', checked)}
                  />
                </div>
                <p className="text-xs text-amber-600">{t.showOriginalDescription || 'Display original text'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Chat Interface */}
        <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-green-600 to-blue-600 p-3 rounded-full shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{t.smartFarmingChat || 'Smart Farming Chat'}</h2>
                <p className="text-gray-600 font-medium">{t.aiPoweredGuidance || 'AI-powered agricultural guidance and support'}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="bg-green-100 px-3 py-1 rounded-full border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-800">{t.aiOnline || 'AI Online'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <ScrollArea className="h-[600px] p-6 bg-gradient-to-br from-blue-50/30 to-green-50/30">
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-6 shadow-lg">
                    <Brain className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">{t.welcomeToAI || 'Welcome to AI Farming Assistant!'}</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {t.welcomeMessage || "I'm here to help you with all your farming questions. Ask me about crops, diseases, weather, government schemes, market prices, or farming techniques."}
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="bg-green-100 p-3 rounded-lg border border-green-200">
                      <Crop className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">{t.cropAdvice || 'Crop Advice'}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
                      <Sun className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-800">{t.weatherInsights || 'Weather Insights'}</p>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start space-x-4",
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg",
                    message.sender === 'user' 
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600' 
                      : 'bg-gradient-to-br from-green-600 to-blue-600'
                  )}>
                    {message.sender === 'user' ? (
                      <User className="h-6 w-6 text-white" />
                    ) : (
                      <Bot className="h-6 w-6 text-white" />
                    )}
                  </div>
                  
                  <div className={cn(
                    "max-w-[75%] space-y-2",
                    message.sender === 'user' ? 'items-end' : 'items-start'
                  )}>
                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "rounded-2xl px-6 py-4 relative group shadow-lg",
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      )}
                    >
                      {/* Message Content */}
                      <div className="text-sm leading-relaxed">
                        {message.content}
                      </div>

                      {/* Original Text (if translated) */}
                      {message.isTranslated && settings.showOriginalText && message.originalText && (
                        <div className={cn(
                          "mt-3 pt-3 border-t",
                          message.sender === 'user' ? 'border-white/30' : 'border-gray-200'
                        )}>
                          <div className={cn(
                            "text-xs flex items-center space-x-1 mb-2",
                            message.sender === 'user' ? 'text-white/80' : 'text-gray-500'
                          )}>
                            <Languages className="h-3 w-3" />
                            <span>{t.original || 'Original'}:</span>
                          </div>
                          <div className={cn(
                            "text-xs italic",
                            message.sender === 'user' ? 'text-white/70' : 'text-gray-600'
                          )}>
                            {message.originalText}
                          </div>
                        </div>
                      )}

                      {/* Message Actions */}
                      {message.sender === 'assistant' && settings.voiceEnabled && (
                        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ClientOnly>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSpeakMessage(message)}
                              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg rounded-full border border-gray-200"
                              disabled={isSpeaking}
                            >
                              {isSpeaking ? (
                                <Loader2 className="h-4 w-4 animate-spin text-gray-700" />
                              ) : (
                                <Volume2 className="h-4 w-4 text-gray-700" />
                              )}
                            </Button>
                          </ClientOnly>
                        </div>
                      )}
                    </div>

                    {/* Message Metadata */}
                    <div className={cn(
                      "flex items-center gap-2 px-2",
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}>
                      <span className="text-xs text-gray-500 font-medium">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {message.isTranslated && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                          <Languages className="h-3 w-3 mr-1" />
                          Translated
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Enhanced Loading Indicator */}
              {isLoading && (
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl px-6 py-4 max-w-[75%] shadow-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {t.aiThinking || 'AI is thinking...'}
                      </span>
                      <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Enhanced Input Area */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 p-6">
            <form onSubmit={handleSubmit} className="flex items-end space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder={t.chatPlaceholder || "💬 Ask me anything about farming... (e.g., 'How to treat tomato blight?')"}
                    disabled={isLoading}
                    className="min-h-[48px] pr-16 text-lg border-gray-300 focus:border-green-500 bg-white shadow-sm rounded-2xl"
                  />
                  
                  {/* Input Actions */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {settings.voiceEnabled && (
                      <ClientOnly fallback={<div className="w-8" />}>
                        <VoiceControls
                          onSpeechResult={handleSpeechResult}
                          onSpeechStart={() => setInputValue('')}
                          onStopSpeaking={handleStopSpeaking}
                          isSpeaking={isSpeaking}
                          disabled={isLoading}
                          showAdvancedControls={false}
                          className="flex-shrink-0"
                        />
                      </ClientOnly>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Send Button */}
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="h-12 px-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {t.sending || 'Sending...'}
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    {t.send || 'Send'}
                  </>
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                🌱 <strong>{t.proTip || 'Pro tip'}:</strong> {t.proTipText || 'Ask about crops, diseases, weather, market prices, government schemes, or farming techniques. I can help in multiple languages!'}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Action Suggestions */}
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
              🚀 {t.tryAskingAbout || 'Try asking me about these topics:'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-green-200 hover:bg-white/80 transition-colors cursor-pointer"
                   onClick={() => setInputValue(t.cropSelectionExample || "What crops are best for my region?")}>
                <Crop className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-800 text-center">{t.cropSelection || 'Crop Selection'}</p>
                <p className="text-xs text-gray-600 text-center mt-1">"{t.cropSelectionExample || 'What crops are best for my region?'}"</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200 hover:bg-white/80 transition-colors cursor-pointer"
                   onClick={() => setInputValue(t.diseaseManagementExample || "How to identify plant diseases?")}>
                <Leaf className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-800 text-center">{t.diseaseManagement || 'Disease Management'}</p>
                <p className="text-xs text-gray-600 text-center mt-1">"{t.diseaseManagementExample || 'How to identify plant diseases?'}"</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-purple-200 hover:bg-white/80 transition-colors cursor-pointer"
                   onClick={() => setInputValue(t.marketPricesExample || "Current market prices for wheat")}>
                <Globe className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-800 text-center">{t.marketPrices || 'Market Prices'}</p>
                <p className="text-xs text-gray-600 text-center mt-1">"{t.marketPricesExample || 'Current market prices for wheat'}"</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-orange-200 hover:bg-white/80 transition-colors cursor-pointer"
                   onClick={() => setInputValue(t.governmentSchemesExample || "Government schemes for farmers")}>
                <Settings className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-800 text-center">{t.governmentSchemes || 'Government Schemes'}</p>
                <p className="text-xs text-gray-600 text-center mt-1">"{t.governmentSchemesExample || 'Government schemes for farmers'}"</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
