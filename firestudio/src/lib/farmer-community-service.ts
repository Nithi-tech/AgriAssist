/**
 * Farmer Community Real-time Chat Service
 * Handles real-time messaging, voice messages, and farmer status using Supabase
 */

import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface FarmerProfile {
  id: string;
  name: string;
  mobile_number?: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'away';
  last_seen?: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  farmer_id: string;
  content?: string;
  voice_url?: string;
  voice_duration?: number;
  message_type: 'text' | 'voice';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  reply_to?: string;
  metadata?: any;
}

export interface ChatMessageWithProfile extends ChatMessage {
  farmer_profile: FarmerProfile;
}

export interface TypingStatus {
  farmer_id: string;
  farmer_name: string;
  is_typing: boolean;
  timestamp: string;
}

export class FarmerCommunityService {
  private channel: RealtimeChannel | null = null;
  private onlineStatusChannel: RealtimeChannel | null = null;
  private currentFarmerId: string | null = null;
  private messageCallbacks: Array<(message: ChatMessageWithProfile) => void> = [];
  private typingCallbacks: Array<(typing: TypingStatus[]) => void> = [];
  private onlineStatusCallbacks: Array<(farmers: FarmerProfile[]) => void> = [];

  constructor() {
    this.initializeChannels();
  }

  private initializeChannels() {
    // Main chat channel for messages
    this.channel = supabase.channel('farmer-community-chat', {
      config: {
        broadcast: { self: false },
        presence: { key: 'farmer_id' },
      },
    });

    // Online status channel
    this.onlineStatusChannel = supabase.channel('farmer-online-status', {
      config: {
        presence: { key: 'farmer_id' },
      },
    });
  }

  async connect(farmerId: string, farmerName: string): Promise<boolean> {
    try {
      this.currentFarmerId = farmerId;

      // Subscribe to real-time messages
      this.channel = supabase
        .channel('farmer-community-chat')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'farmer_community_messages'
        }, (payload) => {
          this.handleNewMessage(payload.new as ChatMessage);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'farmer_community_messages'
        }, (payload) => {
          this.handleMessageUpdate(payload.new as ChatMessage);
        })
        .on('broadcast', {
          event: 'typing'
        }, (payload) => {
          this.handleTypingStatus(payload.payload as TypingStatus);
        });

      // Subscribe to online status
      this.onlineStatusChannel = supabase
        .channel('farmer-online-status')
        .on('presence', {
          event: 'sync'
        }, () => {
          this.handlePresenceSync();
        })
        .on('presence', {
          event: 'join'
        }, ({ newPresences }) => {
          this.handlePresenceJoin(newPresences);
        })
        .on('presence', {
          event: 'leave'
        }, ({ leftPresences }) => {
          this.handlePresenceLeave(leftPresences);
        });

      // Subscribe to channels
      await this.channel.subscribe();
      await this.onlineStatusChannel.subscribe();

      // Track farmer as online
      await this.onlineStatusChannel.track({
        farmer_id: farmerId,
        farmer_name: farmerName,
        online_at: new Date().toISOString(),
      });

      // Update farmer status in database
      await this.updateFarmerStatus(farmerId, 'online');

      return true;
    } catch (error) {
      console.error('Error connecting to chat service:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.currentFarmerId) {
      await this.updateFarmerStatus(this.currentFarmerId, 'offline');
    }

    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }

    if (this.onlineStatusChannel) {
      await this.onlineStatusChannel.unsubscribe();
      this.onlineStatusChannel = null;
    }

    this.currentFarmerId = null;
  }

  async sendTextMessage(content: string, replyTo?: string): Promise<ChatMessage | null> {
    if (!this.currentFarmerId || !content.trim()) return null;

    try {
      const message: Partial<ChatMessage> = {
        farmer_id: this.currentFarmerId,
        content: content.trim(),
        message_type: 'text',
        timestamp: new Date().toISOString(),
        status: 'sending',
        reply_to: replyTo,
      };

      const { data, error } = await supabase
        .from('farmer_community_messages')
        .insert([message])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return null;
      }

      return data as ChatMessage;
    } catch (error) {
      console.error('Error sending text message:', error);
      return null;
    }
  }

  async sendVoiceMessage(audioBlob: Blob, duration: number, replyTo?: string): Promise<ChatMessage | null> {
    if (!this.currentFarmerId) return null;

    try {
      // Upload voice file to Supabase Storage
      const fileName = `voice_${this.currentFarmerId}_${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('farmer-voice-messages')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading voice message:', uploadError);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('farmer-voice-messages')
        .getPublicUrl(fileName);

      const message: Partial<ChatMessage> = {
        farmer_id: this.currentFarmerId,
        voice_url: urlData.publicUrl,
        voice_duration: Math.round(duration),
        message_type: 'voice',
        timestamp: new Date().toISOString(),
        status: 'sending',
        reply_to: replyTo,
      };

      const { data, error } = await supabase
        .from('farmer_community_messages')
        .insert([message])
        .select()
        .single();

      if (error) {
        console.error('Error sending voice message:', error);
        return null;
      }

      return data as ChatMessage;
    } catch (error) {
      console.error('Error sending voice message:', error);
      return null;
    }
  }

  async getRecentMessages(limit: number = 50): Promise<ChatMessageWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('farmer_community_messages')
        .select(`
          *,
          farmer_profiles!farmer_id (
            id,
            name,
            mobile_number,
            avatar_url,
            status,
            last_seen
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return (data || []).reverse() as ChatMessageWithProfile[];
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }

  async getOnlineFarmers(): Promise<FarmerProfile[]> {
    try {
      const { data, error } = await supabase
        .from('farmer_profiles')
        .select('*')
        .in('status', ['online', 'away'])
        .order('last_seen', { ascending: false });

      if (error) {
        console.error('Error fetching online farmers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting online farmers:', error);
      return [];
    }
  }

  async updateFarmerStatus(farmerId: string, status: 'online' | 'offline' | 'away'): Promise<void> {
    try {
      await supabase
        .from('farmer_profiles')
        .upsert({
          id: farmerId,
          status,
          last_seen: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error updating farmer status:', error);
    }
  }

  async markMessagesAsRead(messageIds: string[]): Promise<void> {
    try {
      await supabase
        .from('farmer_community_messages')
        .update({ status: 'read' })
        .in('id', messageIds);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  broadcastTyping(isTyping: boolean): void {
    if (!this.channel || !this.currentFarmerId) return;

    this.channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        farmer_id: this.currentFarmerId,
        is_typing: isTyping,
        timestamp: new Date().toISOString(),
      },
    });
  }

  onNewMessage(callback: (message: ChatMessageWithProfile) => void): void {
    this.messageCallbacks.push(callback);
  }

  onTypingStatus(callback: (typing: TypingStatus[]) => void): void {
    this.typingCallbacks.push(callback);
  }

  onOnlineStatusChange(callback: (farmers: FarmerProfile[]) => void): void {
    this.onlineStatusCallbacks.push(callback);
  }

  private async handleNewMessage(message: ChatMessage): Promise<void> {
    if (message.farmer_id === this.currentFarmerId) return;

    try {
      // Fetch farmer profile
      const { data: profile } = await supabase
        .from('farmer_profiles')
        .select('*')
        .eq('id', message.farmer_id)
        .single();

      if (profile) {
        const messageWithProfile: ChatMessageWithProfile = {
          ...message,
          farmer_profile: profile,
        };

        this.messageCallbacks.forEach(callback => callback(messageWithProfile));
      }
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  }

  private handleMessageUpdate(message: ChatMessage): void {
    // Handle message status updates (sent, delivered, read)
    console.log('Message updated:', message);
  }

  private handleTypingStatus(typing: TypingStatus): void {
    if (typing.farmer_id === this.currentFarmerId) return;
    
    // Update typing indicators
    this.typingCallbacks.forEach(callback => callback([typing]));
  }

  private handlePresenceSync(): void {
    this.updateOnlineStatus();
  }

  private handlePresenceJoin(presences: any[]): void {
    this.updateOnlineStatus();
  }

  private handlePresenceLeave(presences: any[]): void {
    this.updateOnlineStatus();
  }

  private async updateOnlineStatus(): Promise<void> {
    try {
      const farmers = await this.getOnlineFarmers();
      this.onlineStatusCallbacks.forEach(callback => callback(farmers));
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }
}

// Singleton instance
export const farmerCommunityService = new FarmerCommunityService();
