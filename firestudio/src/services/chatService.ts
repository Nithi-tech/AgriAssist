import { supabase } from '@/lib/supabase';
import { ChatMessage, User, MessageLike } from '@/types/chat';
import { RealtimeChannel } from '@supabase/supabase-js';

export class ChatService {
  private static instance: ChatService;
  private channel: RealtimeChannel | null = null;

  private constructor() {}

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
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
  async toggleMessageLike(messageId: string, userId: string): Promise<{ liked: boolean; newCount: number }> {
    try {
      // Check if user already liked this message
      const { data: existingLike, error: checkError } = await supabase
        .from('message_likes')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing like:', checkError);
        throw checkError;
      }

      if (existingLike) {
        // Unlike: Remove the like
        const { error: deleteError } = await supabase
          .from('message_likes')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', userId);

        if (deleteError) {
          console.error('Error removing like:', deleteError);
          throw deleteError;
        }

        // Decrement the likes count
        const { error: updateError } = await supabase
          .from('messages')
          .update({ likes: supabase.sql`likes - 1` })
          .eq('id', messageId);

        if (updateError) {
          console.error('Error decrementing likes count:', updateError);
          throw updateError;
        }

        // Get updated count
        const { data: message } = await supabase
          .from('messages')
          .select('likes')
          .eq('id', messageId)
          .single();

        return { liked: false, newCount: message?.likes || 0 };
      } else {
        // Like: Add the like
        const { error: insertError } = await supabase
          .from('message_likes')
          .insert([
            {
              message_id: messageId,
              user_id: userId
            }
          ]);

        if (insertError) {
          console.error('Error adding like:', insertError);
          throw insertError;
        }

        // Increment the likes count
        const { error: updateError } = await supabase
          .from('messages')
          .update({ likes: supabase.sql`likes + 1` })
          .eq('id', messageId);

        if (updateError) {
          console.error('Error incrementing likes count:', updateError);
          throw updateError;
        }

        // Get updated count
        const { data: message } = await supabase
          .from('messages')
          .select('likes')
          .eq('id', messageId)
          .single();

        return { liked: true, newCount: message?.likes || 1 };
      }
    } catch (error) {
      console.error('Error in toggleMessageLike:', error);
      throw error;
    }
  }

  // ============================================================================
  // REALTIME SUBSCRIPTION
  // ============================================================================

  /**
   * Subscribe to new messages in real-time
   */
  subscribeToMessages(onNewMessage: (message: ChatMessage) => void, onError?: (error: any) => void) {
    try {
      this.channel = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            try {
              // Fetch the complete message with sender information
              const { data: message, error } = await supabase
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
                console.error('Error fetching new message details:', error);
                onError?.(error);
                return;
              }

              onNewMessage(message);
            } catch (error) {
              console.error('Error processing new message:', error);
              onError?.(error);
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
              // Fetch the updated message with sender information
              const { data: message, error } = await supabase
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
                console.error('Error fetching updated message details:', error);
                onError?.(error);
                return;
              }

              // This will be handled by the onNewMessage callback to update existing messages
              onNewMessage(message);
            } catch (error) {
              console.error('Error processing message update:', error);
              onError?.(error);
            }
          }
        )
        .subscribe((status) => {
          console.log('Messages subscription status:', status);
        });

      return this.channel;
    } catch (error) {
      console.error('Error in subscribeToMessages:', error);
      onError?.(error);
      return null;
    }
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribeFromMessages() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  /**
   * Get current user from Supabase Auth
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: authUser, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser.user) {
        console.log('No authenticated user found');
        return null;
      }

      // Try to get user from users table
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.user.id)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        console.error('Error fetching user from database:', dbError);
        throw dbError;
      }

      if (!dbUser) {
        // Create user in database if doesn't exist
        const newUser = {
          id: authUser.user.id,
          email: authUser.user.email || '',
          name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'Unknown User',
          avatar: authUser.user.user_metadata?.avatar_url
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert([newUser])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user in database:', createError);
          throw createError;
        }

        return createdUser;
      }

      return dbUser;
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      throw error;
    }
  }

  /**
   * Create or update user profile
   */
  async upsertUser(user: Partial<User> & { id: string }): Promise<User> {
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
}
