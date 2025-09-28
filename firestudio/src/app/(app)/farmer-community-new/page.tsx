'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { 
  Send, 
  Users, 
  MoreVertical,
  Search,
  Smile,
  Paperclip,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceMessageRecorder, VoiceMessagePlayer } from '@/components/voice-message-recorder';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation';
import { farmerCommunityService, type ChatMessage, type FarmerProfile } from '@/lib/farmer-community-service';

export default function FarmerCommunityPage() {
  const { t } = useUnifiedTranslation();
  const { toast } = useToast();
  
  // Current farmer info - in real app, get from auth
  const [currentFarmerId] = useState('F001');
  const [currentFarmerName] = useState('Ranjith Das');
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineFarmers, setOnlineFarmers] = useState<FarmerProfile[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState<{ [farmerId: string]: boolean }>({});
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize connection and load data
  useEffect(() => {
    let mounted = true;

    const initializeChat = async () => {
      try {
        // Connect to real-time service
        const connected = await farmerCommunityService.connect(currentFarmerId, currentFarmerName);
        
        if (!mounted) return;
        
        setIsConnected(connected);

        if (connected) {
          // Load recent messages
          const recentMessages = await farmerCommunityService.getRecentMessages(50);
          if (mounted) setMessages(recentMessages);

          // Load online farmers
          const farmers = await farmerCommunityService.getOnlineFarmers();
          if (mounted) setOnlineFarmers(farmers);

          // Set up real-time listeners
          farmerCommunityService.onNewMessage((message) => {
            if (mounted) {
              setMessages(prev => [...prev, message]);
              
              // Show toast for new messages from others
              if (message.farmer_id !== currentFarmerId) {
                toast({
                  title: `New message from ${message.farmer_profile.name}`,
                  description: message.message_type === 'text' 
                    ? message.content?.substring(0, 50) + (message.content && message.content.length > 50 ? '...' : '')
                    : '🎤 Voice message',
                });
              }
            }
          });

          farmerCommunityService.onOnlineStatusChange((farmers) => {
            if (mounted) setOnlineFarmers(farmers);
          });

          farmerCommunityService.onTypingStatus((typingList) => {
            if (mounted) {
              const typingState: { [key: string]: boolean } = {};
              typingList.forEach(t => {
                if (t.farmer_id !== currentFarmerId) {
                  typingState[t.farmer_id] = t.is_typing;
                }
              });
              setIsTyping(typingState);
            }
          });

          toast({
            title: "Connected to Farmer Community",
            description: "You can now chat with other farmers in real-time.",
          });
        } else {
          toast({
            title: "Connection failed",
            description: "Could not connect to the community chat.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        if (mounted) {
          toast({
            title: "Connection error",
            description: "Failed to initialize chat. Please refresh the page.",
            variant: "destructive",
          });
        }
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      mounted = false;
      farmerCommunityService.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentFarmerId, currentFarmerName, toast]);

  // Send text message
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !isConnected) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const sentMessage = await farmerCommunityService.sendTextMessage(messageText);
      
      if (sentMessage) {
        // Message will be added via real-time listener
        toast({
          title: "Message sent",
          description: "Your message has been sent to the community.",
        });
      } else {
        toast({
          title: "Failed to send message",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  }, [newMessage, isConnected, toast]);

  // Send voice message
  const handleSendVoiceMessage = useCallback(async (audioBlob: Blob, duration: number) => {
    if (!isConnected) {
      toast({
        title: "Not connected",
        description: "Please check your connection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const sentMessage = await farmerCommunityService.sendVoiceMessage(audioBlob, duration);
      
      if (sentMessage) {
        // Message will be added via real-time listener
        toast({
          title: "Voice message sent",
          description: "Your voice message has been sent to the community.",
        });
      } else {
        toast({
          title: "Failed to send voice message",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Error sending voice message",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    }
  }, [isConnected, toast]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    farmerCommunityService.broadcastTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      farmerCommunityService.broadcastTyping(false);
    }, 3000);
  }, []);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    farmerCommunityService.broadcastTyping(false);
  }, []);

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <PageHeader 
        title={t('farmerCommunity', 'Farmer Community')} 
        description={t('farmerCommunityDescription', 'Connect with fellow farmers, share experiences, and get real-time advice')}
      />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Online Farmers Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-green-600" />
              <span>Online Farmers</span>
              <Badge variant="secondary" className="ml-auto">
                {onlineFarmers.filter(f => f.status === 'online').length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2 p-4">
                {onlineFarmers.map((farmer) => (
                  <div key={farmer.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-green-100 text-green-700">
                          {farmer.id}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white",
                        farmer.status === 'online' && "bg-green-500",
                        farmer.status === 'away' && "bg-yellow-500",
                        farmer.status === 'offline' && "bg-gray-400"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {farmer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {farmer.id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Farmer Community Chat</CardTitle>
                  <p className="text-sm text-gray-500">
                    {onlineFarmers.filter(f => f.status === 'online').length} farmers online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                  isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
                <Button variant="ghost" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Messages Area */}
            <ScrollArea className="h-[450px] p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.farmer_id === currentFarmerId;
                  
                  return (
                    <div key={message.id} className={cn(
                      "flex gap-3",
                      isOwnMessage ? "flex-row-reverse" : "flex-row"
                    )}>
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                            {message.farmer_profile?.id || message.farmer_id}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn(
                        "max-w-[70%] space-y-1 min-w-0",
                        isOwnMessage ? "items-end" : "items-start"
                      )}>
                        {!isOwnMessage && (
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">
                              {message.farmer_profile?.name || `Farmer ${message.farmer_id}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {message.farmer_id}
                            </p>
                          </div>
                        )}
                        
                        <div className={cn(
                          "rounded-2xl px-3 py-2 max-w-full break-words",
                          message.message_type === 'text' && (
                            isOwnMessage 
                              ? "bg-green-600 text-white rounded-br-md" 
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          ),
                          message.message_type === 'voice' && (
                            isOwnMessage
                              ? "bg-green-50 border border-green-200 rounded-br-md"
                              : "bg-blue-50 border border-blue-200 rounded-bl-md"
                          )
                        )}>
                          {message.message_type === 'text' && (
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                          )}
                          
                          {message.message_type === 'voice' && message.voice_url && (
                            <VoiceMessagePlayer
                              audioUrl={message.voice_url}
                              duration={message.voice_duration || 0}
                              onPlay={() => setPlayingVoiceId(message.id)}
                              onPause={() => setPlayingVoiceId(null)}
                              className="min-w-[200px]"
                            />
                          )}
                        </div>
                        
                        <div className={cn(
                          "flex items-center gap-1 text-xs text-gray-500 px-1",
                          isOwnMessage ? "flex-row-reverse" : "flex-row"
                        )}>
                          <span>
                            {formatMessageTime(message.timestamp)}
                          </span>
                          {isOwnMessage && (
                            <span className={cn(
                              message.status === 'sending' && "text-gray-400",
                              message.status === 'sent' && "text-blue-500",
                              message.status === 'delivered' && "text-blue-600",
                              message.status === 'read' && "text-green-600"
                            )}>
                              {message.status === 'sending' && '○'}
                              {message.status === 'sent' && '✓'}
                              {message.status === 'delivered' && '✓✓'}
                              {message.status === 'read' && '✓✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing Indicators */}
                {Object.entries(isTyping).map(([farmerId, typing]) => typing && (
                  <div key={`typing-${farmerId}`} className="flex items-center gap-3">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                        {farmerId}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75" />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            <Separator />

            {/* Message Input */}
            <div className="p-4">
              <div className="flex items-end gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-500 mb-2"
                  disabled={!isConnected}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 space-y-3">
                  <div className="relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTypingStart();
                      }}
                      onBlur={handleTypingStop}
                      placeholder={isConnected ? "Type a message..." : "Connecting..."}
                      className="pr-12"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                          handleTypingStop();
                        }
                      }}
                      disabled={!isConnected}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-gray-500"
                        disabled={!isConnected}
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Voice Message Recorder */}
                  <VoiceMessageRecorder
                    onSendVoiceMessage={handleSendVoiceMessage}
                    disabled={!isConnected || !!newMessage.trim()}
                    maxDuration={120}
                    className="w-full"
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={() => {
                    handleSendMessage();
                    handleTypingStop();
                  }}
                  disabled={!newMessage.trim() || !isConnected}
                  className="bg-green-600 hover:bg-green-700 mb-2"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {!isConnected && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-red-600">
                    Reconnecting to community chat...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
