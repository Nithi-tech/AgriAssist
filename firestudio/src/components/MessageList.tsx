'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { translateResponse } from '@/utils/translateResponse';
import { type Language } from '@/providers/language-provider';
import { Play, Pause, Download, Volume2, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types/farmer-chat';
import { LikeButton } from './LikeButton';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  onToggleLike: (messageId: string) => Promise<{ liked: boolean; likeCount: number }>;
  isLoading?: boolean;
}

interface AudioPlayerState {
  [messageId: string]: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    isLoaded: boolean;
  };
}

interface TranslatedMessage {
  originalContent: string;
  translatedContent: string;
  isTranslated: boolean;
  language: Language;
}

interface MessageTranslations {
  [messageId: string]: TranslatedMessage;
}

export function MessageList({ messages, currentUserId, onToggleLike, isLoading = false }: MessageListProps) {
  const { toast } = useToast();
  const { language, t } = useLanguage();
  const [audioStates, setAudioStates] = useState<AudioPlayerState>({});
  const [messageTranslations, setMessageTranslations] = useState<MessageTranslations>({});
  const [translatingMessages, setTranslatingMessages] = useState<Set<string>>(new Set());
  const audioRefs = useRef<{ [messageId: string]: HTMLAudioElement }>({});

  // Initialize audio state for a message
  const initializeAudioState = useCallback((messageId: string) => {
    if (!audioStates[messageId]) {
      setAudioStates(prev => ({
        ...prev,
        [messageId]: {
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          isLoaded: false
        }
      }));
    }
  }, [audioStates]);

  // Update audio state
  const updateAudioState = useCallback((messageId: string, updates: Partial<AudioPlayerState[string]>) => {
    setAudioStates(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        ...updates
      }
    }));
  }, []);

  // Translate message content for AI or system messages
  const translateMessageContent = useCallback(async (message: ChatMessage) => {
    const messageId = message.id;
    
    // Skip if already translated to current language
    const existingTranslation = messageTranslations[messageId];
    if (existingTranslation?.language === language && existingTranslation.isTranslated) {
      return;
    }

    // Skip translation for user's own messages
    if (message.sender_id === currentUserId) {
      return;
    }

    // Only translate text messages
    if (message.type !== 'text' || !message.content) {
      return;
    }

    setTranslatingMessages(prev => new Set(prev).add(messageId));

    try {
      const translatedContent = await translateResponse(message.content, language);
      
      setMessageTranslations(prev => ({
        ...prev,
        [messageId]: {
          originalContent: message.content,
          translatedContent,
          isTranslated: translatedContent !== message.content,
          language
        }
      }));
    } catch (error) {
      console.error('Translation failed for message:', messageId, error);
      // Store as non-translated to avoid repeated attempts
      setMessageTranslations(prev => ({
        ...prev,
        [messageId]: {
          originalContent: message.content,
          translatedContent: message.content,
          isTranslated: false,
          language
        }
      }));
    } finally {
      setTranslatingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  }, [language, currentUserId, messageTranslations]);

  // Effect to translate messages when language changes or new messages arrive
  useEffect(() => {
    messages.forEach(message => {
      if (message.type === 'text' && message.sender_id !== currentUserId) {
        translateMessageContent(message);
      }
    });
  }, [messages, language, currentUserId, translateMessageContent]);

  // Handle audio play/pause
  const toggleAudioPlayback = useCallback(async (message: ChatMessage) => {
    if (!message.audio_url) return;

    const messageId = message.id;
    initializeAudioState(messageId);

    try {
      // Get or create audio element
      let audio = audioRefs.current[messageId];
      
      if (!audio) {
        audio = new Audio(message.audio_url);
        audioRefs.current[messageId] = audio;

        // Set up audio event listeners
        audio.onloadedmetadata = () => {
          updateAudioState(messageId, {
            duration: audio.duration,
            isLoaded: true
          });
        };

        audio.ontimeupdate = () => {
          updateAudioState(messageId, {
            currentTime: audio.currentTime
          });
        };

        audio.onended = () => {
          updateAudioState(messageId, {
            isPlaying: false,
            currentTime: 0
          });
        };

        audio.onerror = () => {
          updateAudioState(messageId, {
            isPlaying: false
          });
          toast({
            title: t.playbackFailed || "Playback failed",
            description: t.playbackFailedDescription || "Could not play the audio message.",
            variant: "destructive",
          });
        };

        // Load the audio
        audio.load();
      }

      const currentState = audioStates[messageId];
      
      if (currentState?.isPlaying) {
        // Pause audio
        audio.pause();
        updateAudioState(messageId, { isPlaying: false });
      } else {
        // Stop any other playing audio
        Object.entries(audioRefs.current).forEach(([otherId, otherAudio]) => {
          if (otherId !== messageId && otherAudio && !otherAudio.paused) {
            otherAudio.pause();
            updateAudioState(otherId, { isPlaying: false });
          }
        });

        // Play this audio
        await audio.play();
        updateAudioState(messageId, { isPlaying: true });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      updateAudioState(messageId, { isPlaying: false });
      toast({
        title: t.playbackFailed || "Playback failed",
        description: t.playbackFailedDescription || "Could not play the audio message.",
        variant: "destructive",
      });
    }
  }, [audioStates, initializeAudioState, updateAudioState, toast]);

  // Format time for audio player
  const formatAudioTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return t.now || 'Now';
      if (diffMins < 60) return `${diffMins}${t.minutesAgo || 'm ago'}`;
      if (diffHours < 24) return `${diffHours}${t.hoursAgo || 'h ago'}`;
      if (diffDays < 7) return `${diffDays}${t.daysAgo || 'd ago'}`;
      return date.toLocaleDateString();
    } catch {
      return t.unknown || 'Unknown';
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">{t.loadingMessages || 'Loading messages...'}</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Volume2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">{t.noMessagesYet || 'No messages yet'}</h3>
          <p className="text-gray-500">{t.beFirstToStart || 'Be the first to start the conversation!'}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[600px] px-4">
      <div className="space-y-4 py-4">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId;
          const audioState = audioStates[message.id];
          const senderName = message.sender?.name || (t.unknownUser || 'Unknown User');
          const translation = messageTranslations[message.id];
          const isTranslating = translatingMessages.has(message.id);

          return (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-4xl",
                isOwnMessage ? "flex-row-reverse ml-auto" : "mr-auto"
              )}
            >
              {/* Avatar */}
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={message.sender?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-sm font-medium">
                  {getUserInitials(senderName)}
                </AvatarFallback>
              </Avatar>

              {/* Message Content */}
              <div className={cn("flex-1 min-w-0", isOwnMessage && "text-right")}>
                {/* Sender name and timestamp */}
                <div className={cn(
                  "flex items-center gap-2 mb-2",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}>
                  <span className="font-medium text-sm text-gray-700">
                    {isOwnMessage ? (t.you || 'You') : senderName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatMessageTime(message.created_at)}
                  </span>
                  {translation?.isTranslated && (
                    <Badge variant="secondary" className="text-xs">
                      <Languages className="h-3 w-3 mr-1" />
                      {t.translated || 'Translated'}
                    </Badge>
                  )}
                  {isTranslating && (
                    <Badge variant="outline" className="text-xs">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
                      {t.translating || 'Translating...'}
                    </Badge>
                  )}
                </div>

                {/* Message bubble */}
                <Card className={cn(
                  "max-w-lg shadow-sm border",
                  isOwnMessage 
                    ? "bg-green-600 text-white border-green-600" 
                    : "bg-white text-gray-800 border-gray-200"
                )}>
                  <CardContent className="p-3">
                    {message.type === 'text' ? (
                      // Text message with translation support
                      <div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {translation?.isTranslated 
                            ? translation.translatedContent 
                            : message.content
                          }
                        </p>
                        
                        {/* Show original text if translated */}
                        {translation?.isTranslated && (
                          <div className={cn(
                            "mt-2 pt-2 border-t text-xs",
                            isOwnMessage ? "border-green-400 text-green-100" : "border-gray-200 text-gray-600"
                          )}>
                            <div className="flex items-center gap-1 mb-1">
                              <Languages className="h-3 w-3" />
                              <span className="font-medium">{t.original || 'Original'}:</span>
                            </div>
                            <p className="italic opacity-80 whitespace-pre-wrap">
                              {translation.originalContent}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Audio message
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant={isOwnMessage ? "secondary" : "outline"}
                          onClick={() => toggleAudioPlayback(message)}
                          disabled={!audioState?.isLoaded && audioState !== undefined}
                          className="shrink-0 h-8 w-8 p-0"
                        >
                          {audioState?.isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "flex items-center gap-2 text-xs",
                            isOwnMessage ? "text-green-100" : "text-gray-600"
                          )}>
                            <Volume2 className="h-3 w-3" />
                            <span>{t.voiceMessage || 'Voice message'}</span>
                            <span>•</span>
                            <span>
                              {audioState?.duration
                                ? `${formatAudioTime(audioState.currentTime)} / ${formatAudioTime(audioState.duration)}`
                                : message.audio_duration
                                ? `${formatAudioTime(message.audio_duration)}`
                                : '0:00'
                              }
                            </span>
                          </div>

                          {/* Audio progress bar */}
                          {audioState?.duration && (
                            <div className={cn(
                              "mt-1 h-1 rounded-full overflow-hidden",
                              isOwnMessage ? "bg-green-500" : "bg-gray-200"
                            )}>
                              <div
                                className={cn(
                                  "h-full transition-all duration-100",
                                  isOwnMessage ? "bg-white" : "bg-green-500"
                                )}
                                style={{
                                  width: `${(audioState.currentTime / audioState.duration) * 100}%`
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Like button */}
                <div className={cn(
                  "flex items-center gap-2 mt-2",
                  isOwnMessage ? "justify-end" : "justify-start"
                )}>
                  <LikeButton
                    messageId={message.id}
                    initialLikeCount={message.likes}
                    initialIsLiked={message.is_liked_by_user || message.liked_by_user}
                    onToggleLike={onToggleLike}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
