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
  Volume2,
  Wifi,
  WifiOff,
  MessageCircle,
  Shield,
  Heart,
  Mic,
  Phone,
  Video,
  UserPlus,
  Settings,
  Bell,
  Crop
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-amber-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-full mb-6 shadow-xl">
            <MessageCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-700 via-blue-700 to-amber-700 bg-clip-text text-transparent mb-4">
            🌾 Farmer Community Chat
          </h1>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Connect with fellow farmers across India. Share experiences, get advice, and build lasting relationships 
            in our secure farming community.
          </p>
          <div className="flex justify-center items-center gap-2 mt-4">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-gray-600 font-medium">Secure & Verified Community</span>
            <Heart className="h-5 w-5 text-red-500" />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Enhanced Online Farmers Sidebar */}
          <Card className="lg:col-span-1 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-2xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
                <div className="bg-green-200 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-green-700" />
                </div>
                <span>Online Farmers</span>
                <Badge className="ml-auto bg-green-600 text-white shadow-sm">
                  {onlineFarmers.filter(f => f.status === 'online').length}
                </Badge>
              </CardTitle>
              <p className="text-gray-600 mt-1">Active community members</p>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 p-4">
                  {onlineFarmers.map((farmer) => (
                    <div key={farmer.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 cursor-pointer transition-all duration-200 hover:shadow-md">
                      <div className="relative">
                        <Avatar className="h-10 w-10 shadow-md">
                          <AvatarFallback className="text-sm bg-gradient-to-br from-green-100 to-blue-100 text-green-700 font-bold">
                            {farmer.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm",
                          farmer.status === 'online' && "bg-green-500",
                          farmer.status === 'away' && "bg-yellow-500",
                          farmer.status === 'offline' && "bg-gray-400"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {farmer.name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Crop className="h-3 w-3" />
                          Farmer ID: {farmer.id}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            farmer.status === 'online' && "bg-green-500",
                            farmer.status === 'away' && "bg-yellow-500",
                            farmer.status === 'offline' && "bg-gray-400"
                          )} />
                          <span className="text-xs capitalize text-gray-600 font-medium">
                            {farmer.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {onlineFarmers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No farmers online</p>
                      <p className="text-gray-400 text-xs">Check back later</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Enhanced Main Chat Area */}
          <Card className="lg:col-span-3 bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-2xl">
            <CardHeader className="border-b border-gray-200 pb-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-600 to-blue-600 p-3 rounded-full shadow-lg">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gray-800">Community Group Chat</CardTitle>
                    <p className="text-gray-600 font-medium">
                      {onlineFarmers.filter(f => f.status === 'online').length} farmers online • Real-time discussion
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center gap-2 text-sm px-3 py-2 rounded-full shadow-sm",
                    isConnected ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"
                  )}>
                    {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    <span className="font-medium">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                    )} />
                  </div>
                  <Button variant="ghost" size="icon" className="hover:bg-white/50">
                    <Bell className="h-5 w-5 text-gray-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-white/50">
                    <Search className="h-5 w-5 text-gray-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="hover:bg-white/50">
                    <Settings className="h-5 w-5 text-gray-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Enhanced Messages Area */}
              <ScrollArea className="h-[450px] p-6 bg-gradient-to-br from-blue-50/30 to-green-50/30">
                <div className="space-y-6">
                  {messages.length === 0 && (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                        <MessageCircle className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-700 mb-2">Welcome to Farmer Community!</h3>
                      <p className="text-gray-500 mb-4 max-w-md mx-auto">
                        Start a conversation with fellow farmers. Share your experiences, ask questions, or offer advice.
                      </p>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        🌱 Growing together, one conversation at a time
                      </Badge>
                    </div>
                  )}

                  {messages.map((message) => {
                    const isOwnMessage = message.farmerId === currentFarmerId;
                    
                    return (
                      <div key={message.id} className={cn(
                        "flex gap-4",
                        isOwnMessage ? "flex-row-reverse" : "flex-row"
                      )}>
                        {!isOwnMessage && (
                          <Avatar className="h-10 w-10 mt-1 shadow-md">
                            <AvatarFallback className="text-sm bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 font-bold">
                              {message.farmerName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={cn(
                          "max-w-[75%] space-y-2",
                          isOwnMessage ? "items-end" : "items-start"
                        )}>
                          {!isOwnMessage && (
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-bold text-gray-900">
                                {message.farmerName}
                              </p>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                <Crop className="h-3 w-3 mr-1" />
                                {message.farmerId}
                              </Badge>
                            </div>
                          )}
                          
                          <div className={cn(
                            "rounded-2xl px-4 py-3 max-w-full shadow-lg",
                            message.type === 'text' && (
                              isOwnMessage 
                                ? "bg-gradient-to-r from-green-600 to-blue-600 text-white" 
                                : "bg-white text-gray-900 border border-gray-200"
                            ),
                            message.type === 'voice' && "bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200"
                          )}>
                            {message.type === 'text' && (
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                              </p>
                            )}
                            
                            {message.type === 'voice' && (
                              <VoiceMessagePlayer
                                audioUrl={message.voiceUrl!}
                                duration={message.voiceDuration!}
                                onPlay={() => setPlayingVoiceId(message.id)}
                                onPause={() => setPlayingVoiceId(null)}
                                className="min-w-[250px]"
                              />
                            )}
                          </div>
                          
                          <div className={cn(
                            "flex items-center gap-2 text-xs text-gray-500",
                            isOwnMessage ? "flex-row-reverse" : "flex-row"
                          )}>
                            <span className="font-medium">
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            {isOwnMessage && (
                              <span className={cn(
                                "font-bold",
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
                  {Object.entries(isTyping).some(([_, typing]) => typing) && (
                    <div className="flex gap-4">
                      <Avatar className="h-8 w-8 shadow-md">
                        <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                          ...
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-200">
                        <div className="flex items-center gap-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">typing...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              <Separator />

              {/* Enhanced Message Input */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50">
                <div className="flex items-end gap-4">
                  <Button variant="ghost" size="icon" className="text-gray-500 mb-3 hover:bg-white/80">
                    <Paperclip className="h-5 w-5" />
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
                        placeholder="💬 Type your message to the community..."
                        className="pr-24 h-12 text-lg border-gray-300 focus:border-green-500 bg-white shadow-sm rounded-2xl"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        disabled={!isConnected}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                          <Smile className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                          <Mic className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Enhanced Voice Message Recorder */}
                    <VoiceMessageRecorder
                      onSendVoiceMessage={handleSendVoiceMessage}
                      disabled={!!newMessage.trim() || !isConnected}
                      maxDuration={120}
                      className="w-full"
                    />
                  </div>

                  {/* Enhanced Send Button */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 mb-3 h-12 px-6 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send
                  </Button>
                </div>

                {/* Connection Status */}
                {!isConnected && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800">
                      <WifiOff className="h-4 w-4" />
                      <span className="text-sm font-medium">Connection lost. Trying to reconnect...</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
