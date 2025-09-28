'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFarmerChat } from '@/hooks/useFarmerChat';
import { ChatInput } from '@/components/ChatInput';
import { MessageList } from '@/components/MessageList';
import { 
  MessageCircle, 
  Users, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Shield,
  Heart,
  Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FarmerCommunityPage() {
  const {
    messages,
    isLoading,
    error,
    isConnected,
    currentUser,
    sendTextMessage,
    sendVoiceMessage,
    toggleLike,
    retryConnection,
  } = useFarmerChat();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-amber-50">
      <div className="container mx-auto p-4 max-w-6xl">
        
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
          <div className="flex justify-center items-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-gray-600 font-medium">Secure & Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="text-gray-600 font-medium">Supportive Community</span>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-blue-600" />
              <span className="text-gray-600 font-medium">Voice Messages</span>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-6 flex justify-center">
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className={cn(
              "px-4 py-2 text-sm font-medium",
              isConnected && "bg-green-600 hover:bg-green-700"
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Connected • Real-time
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 mr-2" />
                Disconnected
              </>
            )}
          </Badge>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={retryConnection}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Chat Interface */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Community Chat</h3>
                    <p className="text-green-100 text-sm">
                      Welcome, {currentUser?.name || 'Farmer'}!
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
                  {messages.length} messages
                </Badge>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              {/* Messages Area */}
              <div className="bg-gray-50">
                <MessageList
                  messages={messages}
                  currentUserId={currentUser?.id || ''}
                  onToggleLike={toggleLike}
                  isLoading={isLoading}
                />
              </div>
              
              {/* Input Area */}
              <div className="p-6 bg-white border-t">
                <ChatInput
                  onSendMessage={sendTextMessage}
                  onSendVoiceMessage={sendVoiceMessage}
                  disabled={!isConnected}
                  placeholder={
                    isConnected 
                      ? "Share your farming experience, ask questions, or give advice..." 
                      : "Connecting to chat..."
                  }
                />
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    💡 Tip: Use voice messages to share detailed farming experiences. 
                    Like helpful messages to show appreciation!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6 bg-white/80 backdrop-blur-sm border-green-200">
              <MessageCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Real-time Chat</h3>
              <p className="text-gray-600 text-sm">
                Instant messaging with farmers across India. See messages appear in real-time.
              </p>
            </Card>
            
            <Card className="text-center p-6 bg-white/80 backdrop-blur-sm border-blue-200">
              <Mic className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Voice Messages</h3>
              <p className="text-gray-600 text-sm">
                Record and share voice messages for detailed farming discussions.
              </p>
            </Card>
            
            <Card className="text-center p-6 bg-white/80 backdrop-blur-sm border-red-200">
              <Heart className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Like & Appreciate</h3>
              <p className="text-gray-600 text-sm">
                Show appreciation for helpful advice by liking messages.
              </p>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            🌱 Built with care for the farming community • Secure • Real-time • Voice-enabled
          </p>
        </div>
      </div>
    </div>
  );
}
