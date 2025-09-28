/**
 * ============================================================================
 * FARMER COMMUNITY - SUPABASE CLIENT LIBRARY
 * TypeScript/JavaScript client for community messaging with threaded conversations
 * Date: August 16, 2025
 * ============================================================================
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface Message {
  message_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageWithDetails {
  message_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  poster_name: string;
  avatar_url: string | null;
  user_type: 'farmer' | 'admin' | 'expert';
  poster_location: string | null;
  like_count: number;
  reply_count: number;
  thread_depth: number;
  message_type: 'post' | 'reply';
  user_liked?: boolean; // Added dynamically
}

export interface Like {
  like_id: string;
  user_id: string;
  message_id: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  user_type: 'farmer' | 'admin' | 'expert';
  created_at: string;
  updated_at: string;
}

export interface CreateMessageRequest {
  content: string;
  parent_id?: string | null;
  image_url?: string | null;
}

export interface FarmerCommunityResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> extends FarmerCommunityResponse<T[]> {
  count: number;
  hasMore: boolean;
  nextPage: number | null;
}

// ============================================================================
// FARMER COMMUNITY CLIENT CLASS
// ============================================================================

export class FarmerCommunityClient {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    // Use environment variables if not provided
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase URL and Anonymous Key are required');
    }

    this.supabase = createClient(url, key);
  }

  // ============================================================================
  // AUTHENTICATION HELPERS
  // ============================================================================

  /**
   * Get the current authenticated user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      return { data: user, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Get current user's profile
   */
  async getCurrentUserProfile(): Promise<FarmerCommunityResponse<UserProfile>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.data) {
        return { data: null, error: 'User not authenticated', success: false };
      }

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userResult.data.id)
        .single();

      if (error) throw error;

      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  // ============================================================================
  // MESSAGE OPERATIONS
  // ============================================================================

  /**
   * Post a new message or reply
   */
  async postMessage(messageData: CreateMessageRequest): Promise<FarmerCommunityResponse<Message>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.data) {
        return { data: null, error: 'User must be authenticated to post messages', success: false };
      }

      // Validate content
      if (!messageData.content?.trim()) {
        return { data: null, error: 'Message content cannot be empty', success: false };
      }

      if (messageData.content.length > 5000) {
        return { data: null, error: 'Message content cannot exceed 5000 characters', success: false };
      }

      // If replying, verify parent message exists
      if (messageData.parent_id) {
        const { data: parentMessage, error: parentError } = await this.supabase
          .from('messages')
          .select('message_id')
          .eq('message_id', messageData.parent_id)
          .single();

        if (parentError || !parentMessage) {
          return { data: null, error: 'Parent message not found', success: false };
        }
      }

      const { data, error } = await this.supabase
        .from('messages')
        .insert([{
          user_id: userResult.data.id,
          content: messageData.content.trim(),
          parent_id: messageData.parent_id || null,
          image_url: messageData.image_url || null,
        }])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Get all messages with pagination and user details
   */
  async getMessages(
    page: number = 1,
    limit: number = 20,
    parentId: string | null = null
  ): Promise<PaginatedResponse<MessageWithDetails>> {
    try {
      const offset = (page - 1) * limit;

      // Build query
      let query = this.supabase
        .from('messages_with_details')
        .select('*', { count: 'exact' });

      // Filter by parent_id
      if (parentId === null) {
        query = query.is('parent_id', null); // Main posts only
      } else {
        query = query.eq('parent_id', parentId); // Replies to specific message
      }

      // Add pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Add user_liked status for each message
      const userResult = await this.getCurrentUser();
      const messagesWithLikeStatus = data || [];

      if (userResult.data) {
        // Get all likes by current user for these messages
        const messageIds = messagesWithLikeStatus.map(m => m.message_id);
        const { data: userLikes } = await this.supabase
          .from('likes')
          .select('message_id')
          .eq('user_id', userResult.data.id)
          .in('message_id', messageIds);

        const likedMessageIds = new Set(userLikes?.map(l => l.message_id) || []);

        messagesWithLikeStatus.forEach(message => {
          message.user_liked = likedMessageIds.has(message.message_id);
        });
      }

      const totalCount = count || 0;
      const hasMore = offset + limit < totalCount;
      const nextPage = hasMore ? page + 1 : null;

      return {
        data: messagesWithLikeStatus,
        error: null,
        success: true,
        count: totalCount,
        hasMore,
        nextPage
      };
    } catch (error: any) {
      return {
        data: [],
        error: error.message,
        success: false,
        count: 0,
        hasMore: false,
        nextPage: null
      };
    }
  }

  /**
   * Get a specific message with all its replies (threaded view)
   */
  async getMessageThread(messageId: string): Promise<FarmerCommunityResponse<{
    mainMessage: MessageWithDetails,
    replies: MessageWithDetails[]
  }>> {
    try {
      // Get the main message
      const { data: mainMessage, error: mainError } = await this.supabase
        .from('messages_with_details')
        .select('*')
        .eq('message_id', messageId)
        .single();

      if (mainError) throw mainError;

      // Get all replies to this message
      const repliesResult = await this.getMessages(1, 100, messageId);

      if (!repliesResult.success) {
        return { data: null, error: repliesResult.error, success: false };
      }

      return {
        data: {
          mainMessage,
          replies: repliesResult.data || []
        },
        error: null,
        success: true
      };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Update a message (only by message owner)
   */
  async updateMessage(messageId: string, content: string): Promise<FarmerCommunityResponse<Message>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.data) {
        return { data: null, error: 'User must be authenticated', success: false };
      }

      if (!content?.trim()) {
        return { data: null, error: 'Message content cannot be empty', success: false };
      }

      if (content.length > 5000) {
        return { data: null, error: 'Message content cannot exceed 5000 characters', success: false };
      }

      const { data, error } = await this.supabase
        .from('messages')
        .update({ content: content.trim() })
        .eq('message_id', messageId)
        .eq('user_id', userResult.data.id) // Ensure user owns the message
        .select()
        .single();

      if (error) throw error;

      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Delete a message (only by message owner or admin)
   */
  async deleteMessage(messageId: string): Promise<FarmerCommunityResponse<boolean>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.data) {
        return { data: false, error: 'User must be authenticated', success: false };
      }

      const { error } = await this.supabase
        .from('messages')
        .delete()
        .eq('message_id', messageId);

      if (error) throw error;

      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: false, error: error.message, success: false };
    }
  }

  // ============================================================================
  // LIKE OPERATIONS
  // ============================================================================

  /**
   * Like a message
   */
  async likeMessage(messageId: string): Promise<FarmerCommunityResponse<Like>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.data) {
        return { data: null, error: 'User must be authenticated to like messages', success: false };
      }

      // Check if message exists
      const { data: messageExists, error: messageError } = await this.supabase
        .from('messages')
        .select('message_id')
        .eq('message_id', messageId)
        .single();

      if (messageError || !messageExists) {
        return { data: null, error: 'Message not found', success: false };
      }

      const { data, error } = await this.supabase
        .from('likes')
        .insert([{
          user_id: userResult.data.id,
          message_id: messageId
        }])
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate like error
        if (error.code === '23505') {
          return { data: null, error: 'You have already liked this message', success: false };
        }
        throw error;
      }

      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Unlike a message
   */
  async unlikeMessage(messageId: string): Promise<FarmerCommunityResponse<boolean>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.data) {
        return { data: false, error: 'User must be authenticated', success: false };
      }

      const { error } = await this.supabase
        .from('likes')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userResult.data.id);

      if (error) throw error;

      return { data: true, error: null, success: true };
    } catch (error: any) {
      return { data: false, error: error.message, success: false };
    }
  }

  /**
   * Toggle like status for a message
   */
  async toggleLike(messageId: string): Promise<FarmerCommunityResponse<{ liked: boolean, likeCount: number }>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.data) {
        return { data: null, error: 'User must be authenticated', success: false };
      }

      // Check if user already liked this message
      const { data: existingLike } = await this.supabase
        .from('likes')
        .select('like_id')
        .eq('message_id', messageId)
        .eq('user_id', userResult.data.id)
        .single();

      let liked: boolean;

      if (existingLike) {
        // Unlike the message
        const unlikeResult = await this.unlikeMessage(messageId);
        if (!unlikeResult.success) {
          return { data: null, error: unlikeResult.error, success: false };
        }
        liked = false;
      } else {
        // Like the message
        const likeResult = await this.likeMessage(messageId);
        if (!likeResult.success) {
          return { data: null, error: likeResult.error, success: false };
        }
        liked = true;
      }

      // Get updated like count
      const { data: likeCountData, error: countError } = await this.supabase
        .from('likes')
        .select('like_id', { count: 'exact' })
        .eq('message_id', messageId);

      if (countError) throw countError;

      const likeCount = likeCountData?.length || 0;

      return {
        data: { liked, likeCount },
        error: null,
        success: true
      };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Get like count for a message
   */
  async getLikeCount(messageId: string): Promise<FarmerCommunityResponse<number>> {
    try {
      const { data, error, count } = await this.supabase
        .from('likes')
        .select('like_id', { count: 'exact' })
        .eq('message_id', messageId);

      if (error) throw error;

      return { data: count || 0, error: null, success: true };
    } catch (error: any) {
      return { data: 0, error: error.message, success: false };
    }
  }

  // ============================================================================
  // USER PROFILE OPERATIONS
  // ============================================================================

  /**
   * Create or update user profile
   */
  async upsertUserProfile(profileData: Partial<UserProfile>): Promise<FarmerCommunityResponse<UserProfile>> {
    try {
      const userResult = await this.getCurrentUser();
      if (!userResult.data) {
        return { data: null, error: 'User must be authenticated', success: false };
      }

      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert([{
          id: userResult.data.id,
          ...profileData,
        }])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<FarmerCommunityResponse<UserProfile>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { data, error: null, success: true };
    } catch (error: any) {
      return { data: null, error: error.message, success: false };
    }
  }

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================

  /**
   * Search messages by content
   */
  async searchMessages(query: string, page: number = 1, limit: number = 20): Promise<PaginatedResponse<MessageWithDetails>> {
    try {
      if (!query?.trim()) {
        return this.getMessages(page, limit);
      }

      const offset = (page - 1) * limit;

      const { data, error, count } = await this.supabase
        .from('messages_with_details')
        .select('*', { count: 'exact' })
        .textSearch('content', `'${query.trim()}'`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Add user_liked status
      const userResult = await this.getCurrentUser();
      const messagesWithLikeStatus = data || [];

      if (userResult.data) {
        const messageIds = messagesWithLikeStatus.map(m => m.message_id);
        const { data: userLikes } = await this.supabase
          .from('likes')
          .select('message_id')
          .eq('user_id', userResult.data.id)
          .in('message_id', messageIds);

        const likedMessageIds = new Set(userLikes?.map(l => l.message_id) || []);

        messagesWithLikeStatus.forEach(message => {
          message.user_liked = likedMessageIds.has(message.message_id);
        });
      }

      const totalCount = count || 0;
      const hasMore = offset + limit < totalCount;
      const nextPage = hasMore ? page + 1 : null;

      return {
        data: messagesWithLikeStatus,
        error: null,
        success: true,
        count: totalCount,
        hasMore,
        nextPage
      };
    } catch (error: any) {
      return {
        data: [],
        error: error.message,
        success: false,
        count: 0,
        hasMore: false,
        nextPage: null
      };
    }
  }

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Subscribe to new messages
   */
  subscribeToMessages(callback: (message: MessageWithDetails) => void) {
    return this.supabase
      .channel('messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        }, 
        async (payload) => {
          // Fetch the complete message with details
          const { data } = await this.supabase
            .from('messages_with_details')
            .select('*')
            .eq('message_id', payload.new.message_id)
            .single();

          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to like changes
   */
  subscribeToLikes(callback: (like: Like, event: 'INSERT' | 'DELETE') => void) {
    return this.supabase
      .channel('likes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'likes' 
        }, 
        (payload) => {
          const likeData = (payload.new || payload.old) as Like;
          callback(likeData, payload.eventType as 'INSERT' | 'DELETE');
        }
      )
      .subscribe();
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create a new FarmerCommunityClient instance
 */
export function createFarmerCommunityClient(supabaseUrl?: string, supabaseKey?: string): FarmerCommunityClient {
  return new FarmerCommunityClient(supabaseUrl, supabaseKey);
}

/**
 * Format message date for display
 */
export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Validate message content
 */
export function validateMessageContent(content: string): { isValid: boolean; error?: string } {
  if (!content?.trim()) {
    return { isValid: false, error: 'Message content cannot be empty' };
  }
  
  if (content.length > 5000) {
    return { isValid: false, error: 'Message content cannot exceed 5000 characters' };
  }
  
  return { isValid: true };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default FarmerCommunityClient;
