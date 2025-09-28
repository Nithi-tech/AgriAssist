import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, User, ChatState } from '@/types/farmer-chat';
import { farmerChatService } from '@/services/farmerChatService';
import { useToast } from '@/hooks/use-toast';

export function useFarmerChat() {
  const { toast } = useToast();
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    isConnected: false,
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize chat system
  const initializeChat = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get current user
      const user = await farmerChatService.getCurrentUser();
      setCurrentUser(user);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Ensure user exists in database
      await farmerChatService.upsertUser(user);

      // Load existing messages
      const messages = await farmerChatService.getMessages(user.id);
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

      // Show toast for new messages from others
      if (newMessage.sender_id !== currentUser.id) {
        const senderName = newMessage.sender?.name || 'Someone';
        toast({
          title: `New message from ${senderName}`,
          description: newMessage.type === 'text' 
            ? newMessage.content?.substring(0, 50) + (newMessage.content && newMessage.content.length > 50 ? '...' : '')
            : '🎤 Voice message',
        });
      }
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
    const channel = farmerChatService.subscribeToMessages(handleNewMessage, handleError);

    // Store unsubscribe function
    unsubscribeRef.current = () => {
      farmerChatService.unsubscribe();
    };

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isInitialized, currentUser, toast]);

  // Send text message
  const sendTextMessage = useCallback(async (content: string): Promise<void> => {
    if (!currentUser || !content.trim()) return;

    try {
      await farmerChatService.sendTextMessage(currentUser.id, content.trim());
    } catch (error) {
      console.error('Error sending text message:', error);
      toast({
        title: 'Message Failed',
        description: 'Could not send your message. Please try again.',
        variant: 'destructive',
      });
    }
  }, [currentUser, toast]);

  // Send voice message
  const sendVoiceMessage = useCallback(async (audioBlob: Blob, duration: number): Promise<void> => {
    if (!currentUser) return;

    try {
      await farmerChatService.sendVoiceMessage(currentUser.id, audioBlob, duration);
      toast({
        title: 'Voice Message Sent',
        description: 'Your voice message has been sent successfully.',
      });
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: 'Voice Message Failed',
        description: 'Could not send your voice message. Please try again.',
        variant: 'destructive',
      });
    }
  }, [currentUser, toast]);

  // Toggle like on message
  const toggleLike = useCallback(async (messageId: string): Promise<{ liked: boolean; likeCount: number }> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await farmerChatService.toggleLike(messageId, currentUser.id);
      
      // Update local state immediately for better UX
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                likes: result.likeCount,
                is_liked_by_user: result.liked,
                liked_by_user: result.liked
              }
            : msg
        )
      }));

      return result;
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Like Failed',
        description: 'Could not update like. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [currentUser, toast]);

  // Retry connection
  const retryConnection = useCallback(async () => {
    await initializeChat();
  }, [initializeChat]);

  // Initialize on mount
  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    isConnected: state.isConnected,
    currentUser,
    
    // Actions
    sendTextMessage,
    sendVoiceMessage,
    toggleLike,
    retryConnection,
  };
}
