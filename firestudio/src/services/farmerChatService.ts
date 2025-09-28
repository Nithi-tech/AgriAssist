import { supabase } from '@/lib/supabase';
import { ChatMessage, User, MessageLike } from '@/types/farmer-chat';
import { RealtimeChannel } from '@supabase/supabase-js';

export class FarmerChatService {
  private static instance: FarmerChatService;
  private channel: RealtimeChannel | null = null;

  private constructor() {}

  static getInstance(): FarmerChatService {
    if (!FarmerChatService.instance) {
      FarmerChatService.instance = new FarmerChatService();
    }
    return FarmerChatService.instance;
  }

  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // In a real app, get from Supabase auth
      // For demo, return a hardcoded user
      return {
        id: 'user1',
        name: 'राज पटेल',
        email: 'raj@example.com',
        avatar: undefined
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Create or update user profile
   */
  async upsertUser(user: Omit<User, 'created_at'>): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert([user])
        .select()
        .single();

      if (error) {
        console.error('Error upserting user:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in upsertUser:', error);
      throw error;
    }
  }

  // ============================================================================
  // MESSAGE OPERATIONS
  // ============================================================================

  /**
   * Fetch all messages with sender information and user like status
   */
  async getMessages(userId?: string): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          content,
          type,
          likes,
          created_at,
          audio_url,
          audio_duration,
          sender:users(id, name, email, avatar)
        `)
        .order('created_at', { ascending: true });

      const { data: messages, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      if (!messages) return [];

      // If user is provided, check which messages they've liked
      if (userId) {
        const { data: likes, error: likesError } = await supabase
          .from('message_likes')
          .select('message_id')
          .eq('user_id', userId);

        if (likesError) {
          console.error('Error fetching user likes:', likesError);
        }

        const likedMessageIds = new Set(likes?.map(l => l.message_id) || []);

        return messages.map(message => ({
          ...message,
          is_liked_by_user: likedMessageIds.has(message.id),
          liked_by_user: likedMessageIds.has(message.id)
        }));
      }

      return messages;
    } catch (error) {
      console.error('Error in getMessages:', error);
      throw error;
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage(senderId: string, content: string): Promise<ChatMessage> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: senderId,
            content: content.trim(),
            type: 'text',
            likes: 0,
          }
        ])
        .select(`
          id,
          sender_id,
          content,
          type,
          likes,
          created_at,
          audio_url,
          audio_duration,
          sender:users(id, name, email, avatar)
        `)
        .single();

      if (error) {
        console.error('Error sending text message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in sendTextMessage:', error);
      throw error;
    }
  }

  /**
   * Upload audio file to Supabase storage
   */
  async uploadAudioFile(audioBlob: Blob, senderId: string): Promise<string> {
    try {
      const fileName = `chat-audio/${senderId}/${Date.now()}.webm`;
      
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (error) {
        console.error('Error uploading audio file:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadAudioFile:', error);
      throw error;
    }
  }

  /**
   * Send a voice message
   */
  async sendVoiceMessage(
    senderId: string, 
    audioBlob: Blob, 
    duration: number
  ): Promise<ChatMessage> {
    try {
      // First upload the audio file
      const audioUrl = await this.uploadAudioFile(audioBlob, senderId);

      // Then save the message
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: senderId,
            content: '🎤 Voice message',
            type: 'audio',
            likes: 0,
            audio_url: audioUrl,
            audio_duration: Math.round(duration)
          }
        ])
        .select(`
          id,
          sender_id,
          content,
          type,
          likes,
          created_at,
          audio_url,
          audio_duration,
          sender:users(id, name, email, avatar)
        `)
        .single();

      if (error) {
        console.error('Error sending voice message:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in sendVoiceMessage:', error);
      throw error;
    }
  }

  // ============================================================================
  // LIKE OPERATIONS
  // ============================================================================

  /**
   * Toggle like on a message
   */
  async toggleLike(messageId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    try {
      // Check if user already liked this message
      const { data: existingLike, error: checkError } = await supabase
        .from('message_likes')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing like:', checkError);
        throw checkError;
      }

      let liked = false;

      if (existingLike) {
        // Remove like
        const { error: deleteError } = await supabase
          .from('message_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) {
          console.error('Error removing like:', deleteError);
          throw deleteError;
        }
        liked = false;
      } else {
        // Add like
        const { error: insertError } = await supabase
          .from('message_likes')
          .insert([{
            message_id: messageId,
            user_id: userId
          }]);

        if (insertError) {
          console.error('Error adding like:', insertError);
          throw insertError;
        }
        liked = true;
      }

      // Get updated like count
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('likes')
        .eq('id', messageId)
        .single();

      if (messageError) {
        console.error('Error fetching updated likes count:', messageError);
        throw messageError;
      }

      return {
        liked,
        likeCount: messageData.likes
      };
    } catch (error) {
      console.error('Error in toggleLike:', error);
      throw error;
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to real-time message updates
   */
  subscribeToMessages(
    onMessage: (message: ChatMessage) => void,
    onError: (error: any) => void
  ): RealtimeChannel {
    try {
      this.channel = supabase
        .channel('farmer-chat-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            try {
              // Fetch the complete message with sender info
              const { data: messageWithSender, error } = await supabase
                .from('messages')
                .select(`
                  id,
                  sender_id,
                  content,
                  type,
                  likes,
                  created_at,
                  audio_url,
                  audio_duration,
                  sender:users(id, name, email, avatar)
                `)
                .eq('id', payload.new.id)
                .single();

              if (error) {
                console.error('Error fetching new message with sender:', error);
                onError(error);
                return;
              }

              onMessage(messageWithSender);
            } catch (error) {
              console.error('Error processing new message:', error);
              onError(error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            try {
              // Fetch the complete updated message with sender info
              const { data: messageWithSender, error } = await supabase
                .from('messages')
                .select(`
                  id,
                  sender_id,
                  content,
                  type,
                  likes,
                  created_at,
                  audio_url,
                  audio_duration,
                  sender:users(id, name, email, avatar)
                `)
                .eq('id', payload.new.id)
                .single();

              if (error) {
                console.error('Error fetching updated message with sender:', error);
                onError(error);
                return;
              }

              onMessage(messageWithSender);
            } catch (error) {
              console.error('Error processing updated message:', error);
              onError(error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to farmer chat messages');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to farmer chat messages');
            onError(new Error('Failed to subscribe to real-time updates'));
          }
        });

      return this.channel;
    } catch (error) {
      console.error('Error setting up message subscription:', error);
      onError(error);
      throw error;
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(): Promise<void> {
    try {
      if (this.channel) {
        await supabase.removeChannel(this.channel);
        this.channel = null;
        console.log('Unsubscribed from farmer chat messages');
      }
    } catch (error) {
      console.error('Error unsubscribing from messages:', error);
    }
  }
}

export const farmerChatService = FarmerChatService.getInstance();
