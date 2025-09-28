import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, User, ChatState } from '@/types/chat';
import { ChatService } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

export function useChat() {
  const { toast } = useToast();
  const chatService = useRef(ChatService.getInstance());
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    isConnected: false,
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize chat system
  const initializeChat = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get current user
      const user = await chatService.current.getCurrentUser();
      setCurrentUser(user);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Load existing messages
      const messages = await chatService.current.getMessages(user.id);
      setState(prev => ({
        ...prev,
        messages,
        isLoading: false,
        error: null,
        isConnected: true,
      }));

      setIsInitialized(true);
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to initialize chat',
        isConnected: false,
      }));
      toast({
        title: 'Chat Error',
        description: 'Failed to connect to chat. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!isInitialized || !currentUser) return;

    const handleNewMessage = (newMessage: ChatMessage) => {
      setState(prev => {
        // Check if message already exists (for updates)
        const existingIndex = prev.messages.findIndex(msg => msg.id === newMessage.id);
        
        if (existingIndex >= 0) {
          // Update existing message (e.g., likes count changed)
          const updatedMessages = [...prev.messages];
          updatedMessages[existingIndex] = {
            ...updatedMessages[existingIndex],
            ...newMessage,
            // Preserve user-specific like status if it exists
            is_liked_by_user: updatedMessages[existingIndex].is_liked_by_user ?? newMessage.is_liked_by_user,
            liked_by_user: updatedMessages[existingIndex].liked_by_user ?? newMessage.liked_by_user,
          };
          return { ...prev, messages: updatedMessages };
        } else {
          // Add new message
          return {
            ...prev,
            messages: [...prev.messages, newMessage],
          };
        }
      });
    };

    const handleError = (error: any) => {
      console.error('Real-time subscription error:', error);
      setState(prev => ({ ...prev, isConnected: false }));
      toast({
        title: 'Connection Error',
        description: 'Lost connection to chat. Messages may not update in real-time.',
        variant: 'destructive',
      });
    };

    // Subscribe to real-time updates
    const channel = chatService.current.subscribeToMessages(handleNewMessage, handleError);

    return () => {
      chatService.current.unsubscribeFromMessages();
    };
  }, [isInitialized, currentUser, toast]);

  // Send text message
  const sendTextMessage = useCallback(async (content: string): Promise<void> => {
    if (!currentUser || !content.trim()) return;

    try {
      await chatService.current.sendTextMessage(currentUser.id, content.trim());
      // Message will be added via real-time subscription
    } catch (error: any) {
      console.error('Error sending text message:', error);
      toast({
        title: 'Send Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [currentUser, toast]);

  // Send voice message
  const sendVoiceMessage = useCallback(async (audioBlob: Blob, duration: number): Promise<void> => {
    if (!currentUser) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await chatService.current.sendVoiceMessage(currentUser.id, audioBlob, duration);
      setState(prev => ({ ...prev, isLoading: false }));
      // Message will be added via real-time subscription
    } catch (error: any) {
      console.error('Error sending voice message:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: 'Send Error',
        description: 'Failed to send voice message. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [currentUser, toast]);

  // Toggle message like
  const toggleMessageLike = useCallback(async (messageId: string): Promise<void> => {
    if (!currentUser) return;

    try {
      const result = await chatService.current.toggleMessageLike(messageId, currentUser.id);
      
      // Optimistically update the UI
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                likes: result.newCount,
                is_liked_by_user: result.liked,
                liked_by_user: result.liked,
              }
            : msg
        ),
      }));

    } catch (error: any) {
      console.error('Error toggling message like:', error);
      toast({
        title: 'Like Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      });
    }
  }, [currentUser, toast]);

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    if (!currentUser) return;

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const messages = await chatService.current.getMessages(currentUser.id);
      setState(prev => ({
        ...prev,
        messages,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      console.error('Error refreshing messages:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to refresh messages',
      }));
    }
  }, [currentUser]);

  return {
    // State
    ...state,
    currentUser,
    isInitialized,

    // Actions
    initializeChat,
    sendTextMessage,
    sendVoiceMessage,
    toggleMessageLike,
    refreshMessages,
  };
}
