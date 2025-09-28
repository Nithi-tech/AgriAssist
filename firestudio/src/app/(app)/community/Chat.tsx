'use client';

import React, { useEffect, useState } from 'react';
import { Users, Wifi, WifiOff, LogIn, LogOut } from 'lucide-react';
import { useCommunityChat } from '@/hooks/useCommunityChat';
import { supabase } from '@/lib/supabaseCommunity';
import MessageList from '@/components/community/MessageList';
import ChatInput from '@/components/community/ChatInput';
import toast, { Toaster } from 'react-hot-toast';

export default function Chat() {
  const {
    messages,
    loading,
    user,
    sendMessage,
    toggleLike,
    sendReply,
    toggleReplyInput,
    getDisplayName
  } = useCommunityChat();

  const [isOnline, setIsOnline] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Simple auth functions for demonstration
  const signInWithEmail = async () => {
    setAuthLoading(true);
    try {
      // This is a simple email/password auth for demo
      // In production, you'd want proper sign-up/sign-in forms
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/community`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(error.message || 'Failed to sign out');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Farmer Community
              </h1>
              <div className="flex items-center gap-2 text-sm">
                {isOnline ? (
                  <>
                    <Wifi size={14} className="text-green-500" />
                    <span className="text-green-600">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={14} className="text-red-500" />
                    <span className="text-red-600">Offline</span>
                  </>
                )}
                {user && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">
                      {messages.length} message{messages.length !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Auth section */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 hidden sm:block">
                  {getDisplayName(user)}
                </span>
                <button
                  onClick={signOut}
                  disabled={authLoading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={signInWithEmail}
                disabled={authLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {authLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {!user ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <Users size={64} className="text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Farmer Community
              </h2>
              <p className="text-gray-600 mb-6">
                Connect with fellow farmers, share experiences, ask questions, 
                and build a stronger agricultural community together.
              </p>
              <button
                onClick={signInWithEmail}
                disabled={authLoading}
                className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn size={20} />
                )}
                Sign In to Join Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              currentUser={user}
              onToggleLike={toggleLike}
              onSendReply={sendReply}
              onToggleReplyInput={toggleReplyInput}
              getDisplayName={getDisplayName}
            />
            <ChatInput
              onSendMessage={sendMessage}
              disabled={!user || !isOnline}
              placeholder={
                !isOnline 
                  ? "You're offline. Reconnect to send messages." 
                  : "Share your thoughts with the community..."
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
