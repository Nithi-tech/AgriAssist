'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Users, MessageCircle, Clock } from 'lucide-react';

interface ChatMessage {
  id: number;
  author: string;
  message: string;
  timestamp: string;
  isReply?: boolean;
  replyTo?: number;
}

export default function CommunityPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      author: "Amit Kumar",
      message: "Hello everyone! Just harvested my tomatoes. The yield this season has been amazing thanks to the new irrigation techniques we discussed last month.",
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
    },
    {
      id: 2,
      author: "Priya Sharma",
      message: "That's wonderful news Amit! Could you share more details about the irrigation method? I'm planning to try it for my potato crop next season.",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      isReply: true,
      replyTo: 1,
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = "Ranjith Das"; // Fixed username as requested

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send a new message
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now(),
      author: currentUser,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isReply: !!replyingTo,
      replyTo: replyingTo || undefined,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setReplyingTo(null);
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get active users count
  const activeUsers = [...new Set(messages.map(m => m.author))].length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <MessageCircle className="h-8 w-8 text-green-600" />
            🌾 Farmer Community Chat
          </h1>
          <p className="text-gray-600">Connect and chat with fellow farmers</p>
        </div>

        {/* Chat Stats */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{activeUsers} Active Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{messages.length} Messages</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Chat Container */}
        <Card className="shadow-xl">
          <CardHeader className="bg-white border-b">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Community Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages Area */}
            <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.author === currentUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex gap-3 max-w-xs lg:max-w-md ${
                    message.author === currentUser ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    {/* Avatar */}
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-green-500 text-white text-xs">
                        {message.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    {/* Message Bubble */}
                    <div className={`relative ${
                      message.author === currentUser ? 'mr-2' : 'ml-2'
                    }`}>
                      {/* Reply indicator */}
                      {message.isReply && (
                        <div className="text-xs text-gray-500 mb-1 px-3">
                          <span className="opacity-75">↳ Replying to message #{message.replyTo}</span>
                        </div>
                      )}
                      
                      {/* Message content */}
                      <div
                        className={`rounded-2xl px-4 py-2 shadow-sm ${
                          message.author === currentUser
                            ? 'bg-green-500 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md border'
                        } ${message.isReply ? 'border-l-4 border-blue-400' : ''}`}
                      >
                        <div className="text-xs font-medium mb-1 opacity-90">
                          {message.author}
                        </div>
                        <div className="text-sm leading-relaxed">
                          {message.message}
                        </div>
                        <div className="text-xs opacity-75 mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>

                      {/* Reply button */}
                      {message.author !== currentUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(message.id)}
                          className="text-xs h-6 px-2 mt-1 text-gray-500 hover:text-green-600"
                        >
                          Reply
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
              {/* Reply Indicator */}
              {replyingTo && (
                <div className="mb-3 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-700">
                      ↳ Replying to message #{replyingTo}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(null)}
                      className="text-xs h-6 px-2 text-blue-600 hover:text-blue-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="flex gap-3 items-end">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-green-500 text-white text-xs">
                    {currentUser.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`What's on your mind, ${currentUser}?`}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="rounded-full border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim()}
                  className="rounded-full bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* User Info Display */}
              <div className="mt-3 text-center">
                <span className="text-sm text-gray-600">
                  Chatting as: <strong className="text-green-600">{currentUser}</strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
