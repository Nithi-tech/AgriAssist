import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseCommunity';
import { DbMessage, DbReply, DbLike, MessageWithState, RealtimePayload } from '@/types/community';
import { toast } from 'react-hot-toast';

export function useCommunityChat() {
  const [messages, setMessages] = useState<MessageWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Helper function to get display name
  const getDisplayName = (user: any): string => {
    if (!user) return 'Unknown User';
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.email) return user.email.split('@')[0];
    return 'Unknown User';
  };

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Fetch last 50 messages in descending order (newest first)
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Reverse to get chronological order (oldest first)
      const reversedMessages = messagesData.reverse();
      const messageIds = reversedMessages.map(m => m.id);

      // Fetch like counts for these messages
      const { data: likeCounts, error: likeError } = await supabase
        .from('message_like_counts')
        .select('*')
        .in('message_id', messageIds);

      if (likeError) console.warn('Error fetching like counts:', likeError);

      // Fetch replies for these messages
      const { data: repliesData, error: repliesError } = await supabase
        .from('replies')
        .select('*')
        .in('message_id', messageIds)
        .order('created_at', { ascending: true });

      if (repliesError) console.warn('Error fetching replies:', repliesError);

      // Fetch current user's likes
      let currentUserLikes: DbLike[] = [];
      if (session?.user?.id) {
        const { data: userLikesData, error: userLikesError } = await supabase
          .from('likes')
          .select('message_id')
          .eq('user_id', session.user.id)
          .in('message_id', messageIds);

        if (!userLikesError && userLikesData) {
          currentUserLikes = userLikesData;
          setUserLikes(new Set(userLikesData.map(like => like.message_id)));
        }
      }

      // Combine data
      const enrichedMessages: MessageWithState[] = reversedMessages.map(message => {
        const likeCount = likeCounts?.find(lc => lc.message_id === message.id)?.like_count || 0;
        const replies = repliesData?.filter(reply => reply.message_id === message.id) || [];
        const isLiked = currentUserLikes.some(like => like.message_id === message.id);

        return {
          ...message,
          like_count: likeCount,
          replies,
          isLiked,
          showReplyInput: false
        };
      });

      setMessages(enrichedMessages);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!user) {
      toast.error('Please log in to send messages');
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      toast.error('Message cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          content: trimmedContent
        });

      if (error) throw error;
      // Message will be added via realtime subscription
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }, [user]);

  // Toggle like (optimistic update)
  const toggleLike = useCallback(async (messageId: string) => {
    if (!user) {
      toast.error('Please log in to like messages');
      return;
    }

    try {
      const isCurrentlyLiked = userLikes.has(messageId);

      // Optimistic update
      setUserLikes(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.delete(messageId);
        } else {
          newSet.add(messageId);
        }
        return newSet;
      });

      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            isLiked: !isCurrentlyLiked,
            like_count: (msg.like_count || 0) + (isCurrentlyLiked ? -1 : 1)
          };
        }
        return msg;
      }));

      // Check if like exists
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            message_id: messageId,
            user_id: user.id
          });

        if (error) throw error;
      }

    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
      
      // Revert optimistic update on error
      setUserLikes(prev => {
        const newSet = new Set(prev);
        if (userLikes.has(messageId)) {
          newSet.add(messageId);
        } else {
          newSet.delete(messageId);
        }
        return newSet;
      });

      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            isLiked: userLikes.has(messageId),
            like_count: (msg.like_count || 0) + (userLikes.has(messageId) ? 1 : -1)
          };
        }
        return msg;
      }));
    }
  }, [user, userLikes]);

  // Send reply
  const sendReply = useCallback(async (messageId: string, replyContent: string) => {
    if (!user) {
      toast.error('Please log in to reply');
      return;
    }

    const trimmedContent = replyContent.trim();
    if (!trimmedContent) {
      toast.error('Reply cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('replies')
        .insert({
          user_id: user.id,
          message_id: messageId,
          reply_content: trimmedContent
        });

      if (error) throw error;
      // Reply will be added via realtime subscription
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    }
  }, [user]);

  // Toggle reply input visibility
  const toggleReplyInput = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, showReplyInput: !msg.showReplyInput };
      }
      return msg;
    }));
  }, []);

  // Setup realtime subscriptions
  useEffect(() => {
    const channel = supabase.channel('community-realtime');

    // Subscribe to new messages
    channel.on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload: RealtimePayload<DbMessage>) => {
        console.log('New message:', payload.new);
        const newMessage: MessageWithState = {
          ...payload.new,
          like_count: 0,
          replies: [],
          isLiked: false,
          showReplyInput: false
        };
        setMessages(prev => [...prev, newMessage]);
      }
    );

    // Subscribe to like changes
    channel.on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'likes' },
      (payload: RealtimePayload<DbLike>) => {
        console.log('New like:', payload.new);
        setMessages(prev => prev.map(msg => {
          if (msg.id === payload.new.message_id) {
            return {
              ...msg,
              like_count: (msg.like_count || 0) + 1
            };
          }
          return msg;
        }));
      }
    );

    channel.on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'likes' },
      (payload: RealtimePayload<DbLike>) => {
        console.log('Like removed:', payload.old);
        setMessages(prev => prev.map(msg => {
          if (msg.id === payload.old.message_id) {
            return {
              ...msg,
              like_count: Math.max(0, (msg.like_count || 0) - 1)
            };
          }
          return msg;
        }));
      }
    );

    // Subscribe to new replies
    channel.on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'replies' },
      (payload: RealtimePayload<DbReply>) => {
        console.log('New reply:', payload.new);
        setMessages(prev => prev.map(msg => {
          if (msg.id === payload.new.message_id) {
            return {
              ...msg,
              replies: [...(msg.replies || []), payload.new]
            };
          }
          return msg;
        }));
      }
    );

    channel.subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (event === 'SIGNED_IN') {
          loadInitialData();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadInitialData]);

  return {
    messages,
    loading,
    user,
    sendMessage,
    toggleLike,
    sendReply,
    toggleReplyInput,
    getDisplayName
  };
}
