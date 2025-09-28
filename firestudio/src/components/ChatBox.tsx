'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, MicOff, MessageSquare } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isSender: boolean;
  timestamp: string;
  isVoiceMessage?: boolean;
}

const ChatBox = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Always expanded by default
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with dummy messages
  useEffect(() => {
    const dummyMessages: Message[] = [
      {
        id: 1,
        text: "Welcome to the farmer community chat! Feel free to ask questions or share your farming experiences.",
        isSender: false,
        timestamp: "10:30 AM"
      },
      {
        id: 2,
        text: "Hello everyone! Happy to be here. Looking forward to learning from fellow farmers.",
        isSender: true,
        timestamp: "10:32 AM"
      },
      {
        id: 3,
        text: "That's great! What crops are you currently growing? Any challenges with the weather this season?",
        isSender: false,
        timestamp: "10:35 AM"
      }
    ];
    setMessages(dummyMessages);
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending text messages
  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: Message = {
        id: Date.now(),
        text: inputMessage.trim(),
        isSender: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
      
      // Simulate a reply after 2 seconds
      setTimeout(() => {
        const replies = [
          "Thanks for sharing! That's really helpful for the community.",
          "Great question! Has anyone else experienced something similar?",
          "That's a valuable tip! I'll definitely try that on my farm.",
          "Interesting approach! How long have you been using this method?",
          "Thanks for the update! It's great to hear from fellow farmers."
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        const replyMessage: Message = {
          id: Date.now() + 1,
          text: randomReply,
          isSender: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, replyMessage]);
      }, 2000);
    }
  };

  // Handle voice recording simulation
  const handleVoiceRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      
      // Simulate recording for 3 seconds
      setTimeout(() => {
        setIsRecording(false);
        
        const voiceMessage: Message = {
          id: Date.now(),
          text: "🎵 Voice message (3s)",
          isSender: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isVoiceMessage: true
        };
        
        setMessages(prev => [...prev, voiceMessage]);
      }, 3000);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <Card className="bg-white shadow-lg border-2 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-xl text-gray-800">
            <MessageSquare className="h-6 w-6 mr-2 text-green-600" />
            Community Chat - Share Your Farming Experience
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
            {/* Messages Area */}
            <div 
              className="h-80 overflow-y-auto bg-gray-50 rounded-lg p-4 mb-4 space-y-3"
              style={{ scrollBehavior: 'smooth' }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isSender ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isSender
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <span className={`text-xs font-semibold ${
                        message.isSender ? 'text-green-100' : 'text-green-600'
                      }`}>
                        {message.isSender ? 'You:' : 'Farmer:'}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${message.isVoiceMessage ? 'italic' : ''}`}>
                      {message.text}
                    </p>
                    <p className={`text-xs mt-1 ${
                      message.isSender ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Recording Indicator */}
            {isRecording && (
              <div className="flex items-center justify-center mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 border-gray-300 focus:border-green-500 focus:ring-green-500"
                disabled={isRecording}
              />
              
              {/* Voice Message Button */}
              <Button
                onClick={handleVoiceRecording}
                disabled={isRecording}
                variant="outline"
                size="icon"
                className={`border-gray-300 hover:border-green-500 ${
                  isRecording ? 'bg-red-50 border-red-300' : ''
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 text-red-600" />
                ) : (
                  <Mic className="h-4 w-4 text-gray-600 hover:text-green-600" />
                )}
              </Button>
              
              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isRecording}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Info */}
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                Connect with farmers instantly • No sign-up required • Messages are not saved
              </p>
            </div>
          </CardContent>
      </Card>
    </div>
  );
};

export default ChatBox;
