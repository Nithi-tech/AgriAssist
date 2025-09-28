
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Mic, MicOff, User, Bot, Volume2, Loader2, Square, Languages, Globe } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { LanguageSelector } from '@/components/language-selector';
import { VoiceControls, useSpeech } from '@/components/voice-controls';
import { SpeechResult, TranslationService } from '@/lib/multi-language-voice';

// Import speech types
import '../../../lib/speech-types';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

interface ChatFormProps {
  handleFormSubmit: (e: React.FormEvent) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  isBotTyping: boolean;
  isListening: boolean;
  handleVoiceInput: () => void;
  stopSpeaking: () => void;
}

const ChatForm = ({
  handleFormSubmit,
  inputValue,
  setInputValue,
  isBotTyping,
  isListening,
  handleVoiceInput,
  stopSpeaking
}: ChatFormProps) => (
  <div className="flex items-center gap-2">
    <form onSubmit={handleFormSubmit} className="flex-1 flex gap-2">
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type a message..."
        autoComplete="off"
        disabled={isBotTyping}
      />
      <Button type="submit" size="icon" disabled={!inputValue.trim() || isBotTyping}>
        <Send className="h-4 w-4" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
     <Button
      type="button"
      size="icon"
      variant={isListening ? 'destructive' : 'outline'}
      onClick={handleVoiceInput}
      disabled={isBotTyping}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      <span className="sr-only">Use Voice</span>
    </Button>
    <Button
      type="button"
      size="icon"
      variant="outline"
      onClick={stopSpeaking}
    >
      <Square className="h-4 w-4" />
      <span className="sr-only">Stop Voice</span>
    </Button>
  </div>
);

const ChatFormSkeleton = () => (
   <div className="flex gap-2">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-10 rounded-md" />
      <Skeleton className="h-10 w-10 rounded-md" />
      <Skeleton className="h-10 w-10 rounded-md" />
    </div>
);


export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language: currentLanguage } = useLanguage();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!isClient) return;

    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      const langMap: { [key: string]: string } = { en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN' };
      recognition.lang = langMap[currentLanguage] || 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        sendMessage(transcript);
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }
  }, [isClient, currentLanguage]);

  const speak = (text: string, lang = 'en-US') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const selectedVoice = voices.find(voice => voice.lang === lang);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = lang;
      } else {
        const fallbackVoice = voices.find(voice => voice.lang.startsWith(lang.split('-')[0])) || voices.find(voice => voice.default);
        if(fallbackVoice) {
          utterance.voice = fallbackVoice;
          utterance.lang = fallbackVoice.lang;
        } else {
           console.warn(`Voice for lang '${lang}' not found. Falling back to default.`);
        }
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };
  
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const getLanguageOfText = () => {
    const langMap: { [key: string]: string } = { en: 'en-US', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN' };
    return langMap[currentLanguage] || 'en-US';
  };

  const sendMessage = async (text: string) => {
    if (text.trim() === '') return;

    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsBotTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response from the bot.");
      }
      
      const botMessage: Message = { id: Date.now() + 1, text: data.reply, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      
      const lang = getLanguageOfText();
      speak(data.reply, lang);

    } catch (error: any) {
      console.error("Failed to send message:", error);
      
      let errorMessageText = error.message || "Sorry, I'm having trouble connecting. Please try again later.";
      if (error.message.includes('quota')) {
        errorMessageText = "Sorry, I've hit my usage limit for today. Please try again later.";
      } else if (error.message.includes('Failed to get response from AI')) {
        errorMessageText = `Sorry, there was an issue with the AI service: ${error.message.substring(error.message.indexOf('{'))}`;
      }
      
      const errorMessage: Message = { id: Date.now() + 1, text: errorMessageText, sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsBotTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
        setIsListening(true);
      }
    } else {
      alert('Speech Recognition API is not supported in this browser.');
    }
  };
  

  return (
    <>
      <PageHeader title="Chat with Bot" subtitle="Ask questions or use voice input" />
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-start gap-3',
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.sender === 'bot' && (
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Bot size={20} />
                    </span>
                  )}
                  <div
                    className={cn(
                      'max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg flex items-center gap-2',
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm" dir="auto">{message.text}</p>
                     {message.sender === 'bot' && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => speak(message.text, getLanguageOfText())}>
                        <Volume2 className="h-4 w-4" />
                        <span className="sr-only">Speak message</span>
                      </Button>
                    )}
                  </div>
                  {message.sender === 'user' && (
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                      <User size={20} />
                    </span>
                  )}
                </div>
              ))}
               {isBotTyping && (
                <div className="flex items-start gap-3 justify-start">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot size={20} />
                  </span>
                  <div className="bg-muted p-3 rounded-lg">
                     <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
          <div className="p-4 border-t">
            {isClient ? <ChatForm 
              handleFormSubmit={handleFormSubmit}
              inputValue={inputValue}
              setInputValue={setInputValue}
              isBotTyping={isBotTyping}
              isListening={isListening}
              handleVoiceInput={handleVoiceInput}
              stopSpeaking={stopSpeaking}
            /> : <ChatFormSkeleton />}
          </div>
        </Card>
      </div>
    </>
  );
}
