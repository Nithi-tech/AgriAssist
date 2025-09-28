import { supabase } from './supabaseClient';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Types for the farmer community chat system
export interface FarmerProfile {
  id: string;
  farmer_id: string;
  display_name: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  farmer_profile_id: string;
  content?: string;
  message_type: 'text' | 'voice' | 'system';
  voice_url?: string;
  voice_duration?: number;
  reply_to_message_id?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  farmer_profile: FarmerProfile;
}

export interface TypingIndicator {
  farmer_profile_id: string;
  is_typing: boolean;
  updated_at: string;
  farmer_profile: FarmerProfile;
}

export interface OnlineStatus {
  farmer_profile_id: string;
  is_online: boolean;
  last_seen: string;
  farmer_profile: FarmerProfile;
}

// Event handlers interface
export interface FarmerCommunityEvents {
  onNewMessage?: (message: ChatMessage) => void;
  onMessageUpdate?: (message: ChatMessage) => void;
  onMessageDelete?: (messageId: string) => void;
  onTypingChange?: (typing: TypingIndicator) => void;
  onOnlineStatusChange?: (status: OnlineStatus) => void;
  onConnectionStateChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

class FarmerCommunityService {
  private messagesChannel: RealtimeChannel | null = null;
  private presenceChannel: RealtimeChannel | null = null;
  private typingChannel: RealtimeChannel | null = null;
  private currentFarmerId: string | null = null;
  private events: FarmerCommunityEvents = {};
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private typingTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.setupConnectionMonitoring();
  }

  /**
   * Initialize the service with event handlers
   */
  initialize(events: FarmerCommunityEvents): void {
    this.events = events;
  }

  /**
   * Connect to real-time channels for a specific farmer
   */
  async connect(farmerId: string): Promise<void> {
    try {
      this.currentFarmerId = farmerId;
      
      // Ensure farmer profile exists
      await this.ensureFarmerProfile(farmerId);
      
      // Connect to channels
      await this.connectToMessagesChannel();
      await this.connectToPresenceChannel();
      await this.connectToTypingChannel();
      
      // Set farmer as online
      await this.updateOnlineStatus(true);
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.events.onConnectionStateChange?.(true);
      
      console.log(`✅ Farmer Community Service connected for farmer: ${farmerId}`);
      
    } catch (error) {
      console.error('❌ Error connecting to Farmer Community Service:', error);
      this.events.onError?.(error as Error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from all channels
   */
  async disconnect(): Promise<void> {
    try {
      // Set farmer as offline before disconnecting
      if (this.currentFarmerId) {
        await this.updateOnlineStatus(false);
      }

      // Unsubscribe from channels
      if (this.messagesChannel) {
        await supabase.removeChannel(this.messagesChannel);
        this.messagesChannel = null;
      }

      if (this.presenceChannel) {
        await supabase.removeChannel(this.presenceChannel);
        this.presenceChannel = null;
      }

      if (this.typingChannel) {
        await supabase.removeChannel(this.typingChannel);
        this.typingChannel = null;
      }

      // Clear timeouts
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }

      this.isConnected = false;
      this.currentFarmerId = null;
      this.events.onConnectionStateChange?.(false);
      
      console.log('✅ Farmer Community Service disconnected');
      
    } catch (error) {
      console.error('❌ Error disconnecting from Farmer Community Service:', error);
      this.events.onError?.(error as Error);
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage(content: string, replyToMessageId?: string): Promise<ChatMessage | null> {
    if (!this.currentFarmerId) {
      throw new Error('Not connected to Farmer Community Service');
    }

    try {
      const farmerProfile = await this.getFarmerProfile(this.currentFarmerId);
      if (!farmerProfile) {
        throw new Error('Farmer profile not found');
      }

      const { data, error } = await supabase
        .from('farmer_community_messages')
        .insert({
          farmer_profile_id: farmerProfile.id,
          content,
          message_type: 'text',
          reply_to_message_id: replyToMessageId,
        })
        .select(`
          *,
          farmer_profile:farmer_profiles(*)
        `)
        .single();

      if (error) throw error;

      return data as ChatMessage;
      
    } catch (error) {
      console.error('❌ Error sending text message:', error);
      this.events.onError?.(error as Error);
      return null;
    }
  }

  /**
   * Send a voice message
   */
  async sendVoiceMessage(audioBlob: Blob, duration: number, replyToMessageId?: string): Promise<ChatMessage | null> {
    if (!this.currentFarmerId) {
      throw new Error('Not connected to Farmer Community Service');
    }

    try {
      const farmerProfile = await this.getFarmerProfile(this.currentFarmerId);
      if (!farmerProfile) {
        throw new Error('Farmer profile not found');
      }

      // Upload audio to Supabase Storage
      const fileName = `voice_${Date.now()}_${this.currentFarmerId}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      // Save message to database
      const { data, error } = await supabase
        .from('farmer_community_messages')
        .insert({
          farmer_profile_id: farmerProfile.id,
          message_type: 'voice',
          voice_url: urlData.publicUrl,
          voice_duration: duration,
          reply_to_message_id: replyToMessageId,
        })
        .select(`
          *,
          farmer_profile:farmer_profiles(*)
        `)
        .single();

      if (error) throw error;

      return data as ChatMessage;
      
    } catch (error) {
      console.error('❌ Error sending voice message:', error);
      this.events.onError?.(error as Error);
      return null;
    }
  }

  /**
   * Get recent messages with pagination
   */
  async getMessages(limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('farmer_community_messages')
        .select(`
          *,
          farmer_profile:farmer_profiles(*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Return in ascending order (oldest first)
      return (data as ChatMessage[]).reverse();
      
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      this.events.onError?.(error as Error);
      return [];
    }
  }

  /**
   * Get online farmers
   */
  async getOnlineFarmers(): Promise<FarmerProfile[]> {
    try {
      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('is_online', true)
        .order('last_seen', { ascending: false });

      if (error) throw error;

      return data as FarmerProfile[];
      
    } catch (error) {
      console.error('❌ Error fetching online farmers:', error);
      this.events.onError?.(error as Error);
      return [];
    }
  }

  /**
   * Set typing indicator
   */
  async setTyping(isTyping: boolean): Promise<void> {
    if (!this.currentFarmerId) return;

    try {
      const farmerProfile = await this.getFarmerProfile(this.currentFarmerId);
      if (!farmerProfile) return;

      // Clear existing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }

      // Update typing status
      const { error } = await supabase
        .from('farmer_typing_indicators')
        .upsert({
          farmer_profile_id: farmerProfile.id,
          is_typing: isTyping,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Auto-clear typing after 3 seconds
      if (isTyping) {
        this.typingTimeout = setTimeout(() => {
          this.setTyping(false);
        }, 3000);
      }
      
    } catch (error) {
      console.error('❌ Error setting typing indicator:', error);
      this.events.onError?.(error as Error);
    }
  }

  /**
   * Delete a message (if owner)
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    if (!this.currentFarmerId) return false;

    try {
      const farmerProfile = await this.getFarmerProfile(this.currentFarmerId);
      if (!farmerProfile) return false;

      const { error } = await supabase
        .from('farmer_community_messages')
        .delete()
        .eq('id', messageId)
        .eq('farmer_profile_id', farmerProfile.id);

      if (error) throw error;

      return true;
      
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      this.events.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Edit a message (if owner)
   */
  async editMessage(messageId: string, newContent: string): Promise<boolean> {
    if (!this.currentFarmerId) return false;

    try {
      const farmerProfile = await this.getFarmerProfile(this.currentFarmerId);
      if (!farmerProfile) return false;

      const { error } = await supabase
        .from('farmer_community_messages')
        .update({
          content: newContent,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('farmer_profile_id', farmerProfile.id);

      if (error) throw error;

      return true;
      
    } catch (error) {
      console.error('❌ Error editing message:', error);
      this.events.onError?.(error as Error);
      return false;
    }
  }

  // Private methods

  private async ensureFarmerProfile(farmerId: string): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('farmer_id', farmerId)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('farmer_profiles')
          .insert({
            farmer_id: farmerId,
            display_name: `Farmer ${farmerId}`,
            is_online: false,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('❌ Error ensuring farmer profile:', error);
      throw error;
    }
  }

  private async getFarmerProfile(farmerId: string): Promise<FarmerProfile | null> {
    try {
      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('farmer_id', farmerId)
        .single();

      if (error) throw error;

      return data as FarmerProfile;
    } catch (error) {
      console.error('❌ Error fetching farmer profile:', error);
      return null;
    }
  }

  private async connectToMessagesChannel(): Promise<void> {
    this.messagesChannel = supabase
      .channel('farmer_community_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'farmer_community_messages'
        },
        async (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          try {
            // Ensure payload has the required data
            if (!payload.new || !('id' in payload.new)) {
              console.warn('Invalid message payload received');
              return;
            }

            // Fetch full message with farmer profile
            const { data } = await supabase
              .from('farmer_community_messages')
              .select(`
                *,
                farmer_profile:farmer_profiles(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              this.events.onNewMessage?.(data as ChatMessage);
            }
          } catch (error) {
            console.error('❌ Error handling new message:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'farmer_community_messages'
        },
        async (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          try {
            // Ensure payload has the required data
            if (!payload.new || !('id' in payload.new)) {
              console.warn('Invalid message update payload received');
              return;
            }

            // Fetch updated message with farmer profile
            const { data } = await supabase
              .from('farmer_community_messages')
              .select(`
                *,
                farmer_profile:farmer_profiles(*)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              this.events.onMessageUpdate?.(data as ChatMessage);
            }
          } catch (error) {
            console.error('❌ Error handling message update:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'farmer_community_messages'
        },
        (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          // Ensure payload has the required data
          if (!payload.old || !('id' in payload.old) || !payload.old.id) {
            console.warn('Invalid message delete payload received');
            return;
          }

          this.events.onMessageDelete?.(payload.old.id);
        }
      );

    await this.messagesChannel.subscribe();
  }

  private async connectToPresenceChannel(): Promise<void> {
    this.presenceChannel = supabase
      .channel('farmer_presence')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'farmer_profiles',
          filter: 'is_online=eq.true'
        },
        async (payload: RealtimePostgresChangesPayload<FarmerProfile>) => {
          // Ensure payload has the required data
          if (!payload.new || !('id' in payload.new) || !('is_online' in payload.new) || !('last_seen' in payload.new)) {
            console.warn('Invalid presence payload received');
            return;
          }

          this.events.onOnlineStatusChange?.({
            farmer_profile_id: payload.new.id,
            is_online: payload.new.is_online,
            last_seen: payload.new.last_seen,
            farmer_profile: payload.new as FarmerProfile
          });
        }
      );

    await this.presenceChannel.subscribe();
  }

  private async connectToTypingChannel(): Promise<void> {
    this.typingChannel = supabase
      .channel('farmer_typing')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'farmer_typing_indicators'
        },
        async (payload: RealtimePostgresChangesPayload<TypingIndicator>) => {
          try {
            // Ensure payload has the required data
            if (!payload.new || !('farmer_profile_id' in payload.new)) {
              console.warn('Invalid typing payload received');
              return;
            }

            // Skip own typing events
            const farmerProfile = await this.getFarmerProfile(this.currentFarmerId!);
            if (farmerProfile && payload.new.farmer_profile_id === farmerProfile.id) {
              return;
            }

            // Fetch typing indicator with farmer profile
            const { data } = await supabase
              .from('farmer_typing_indicators')
              .select(`
                *,
                farmer_profile:farmer_profiles(*)
              `)
              .eq('farmer_profile_id', payload.new.farmer_profile_id)
              .single();

            if (data) {
              this.events.onTypingChange?.(data as TypingIndicator);
            }
          } catch (error) {
            console.error('❌ Error handling typing indicator:', error);
          }
        }
      );

    await this.typingChannel.subscribe();
  }

  private async updateOnlineStatus(isOnline: boolean): Promise<void> {
    if (!this.currentFarmerId) return;

    try {
      const { error } = await supabase
        .from('farmer_profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('farmer_id', this.currentFarmerId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error updating online status:', error);
    }
  }

  private setupConnectionMonitoring(): void {
    // Monitor Supabase connection status
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        this.disconnect();
      }
    });

    // Monitor network connectivity
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.currentFarmerId && !this.isConnected) {
          console.log('🌐 Network reconnected, attempting to reconnect...');
          this.connect(this.currentFarmerId);
        }
      });

      window.addEventListener('offline', () => {
        console.log('🌐 Network disconnected');
        this.events.onConnectionStateChange?.(false);
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    this.reconnectAttempts++;

    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.currentFarmerId) {
        this.connect(this.currentFarmerId);
      }
    }, delay);
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get currentFarmerProfileId(): string | null {
    return this.currentFarmerId;
  }
}

// Export singleton instance
export const farmerCommunityService = new FarmerCommunityService();
