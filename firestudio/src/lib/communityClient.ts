/**
 * Farmer Community Client
 * TypeScript client for managing community messages, replies, and likes
 */

import { supabase } from './supabaseClient';
// Import i18n instance for language awareness
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import i18n from './i18n.js';

// Type definitions
export interface CommunityMessage {
  message_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityMessageWithDetails {
  message_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  user_name: string;
  mobile_number: string;
  like_count: number;
  is_main_post: boolean;
}

export interface CommunityLike {
  like_id: string;
  user_id: string;
  message_id: string;
  created_at: string;
}

export interface CreateMessageData {
  content: string;
  image_url?: string;
  parent_id?: string; // For replies
  lang?: SupportedLanguage; // Language for the message
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// Language support constants
const SUPPORTED_LANGUAGES = ['ta', 'en', 'hi', 'te', 'bn', 'as', 'gu'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Get current language from i18n with fallback to English
 */
const getCurrentLanguage = (): SupportedLanguage => {
  try {
    const currentLang = i18n.language;
    return SUPPORTED_LANGUAGES.includes(currentLang as SupportedLanguage) 
      ? (currentLang as SupportedLanguage)
      : 'en';
  } catch (error) {
    console.warn('Failed to get current language, falling back to English:', error);
    return 'en';
  }
};

/**
 * Enhanced message data interface with language context
 */
export interface CommunityMessageWithDetailsAndLang extends CommunityMessageWithDetails {
  detected_language?: SupportedLanguage;
  requires_translation?: boolean;
}

/**
 * Post a new message (main post or reply)
 */
export const postMessage = async (
  messageData: CreateMessageData,
  userId: string
): Promise<ApiResponse<CommunityMessage>> => {
  try {
    // Validate input
    if (!messageData.content || messageData.content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (messageData.content.length > 2000) {
      throw new Error('Message content cannot exceed 2000 characters');
    }

    // Detect current language if not provided
    const messageLanguage = messageData.lang || getCurrentLanguage();

    const { data, error } = await supabase
      .from('community_messages')
      .insert([{
        user_id: userId,
        content: messageData.content.trim(),
        image_url: messageData.image_url || null,
        parent_id: messageData.parent_id || null,
        // Note: Add lang column to database schema if you want to store language
        // lang: messageLanguage
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Log language info for debugging
    console.log(`Message posted in language: ${messageLanguage}`);
    
    return { data, error: null };
  } catch (error) {
    console.error('Error posting message:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Reply to a message
 */
export const replyToMessage = async (
  parentMessageId: string,
  content: string,
  userId: string,
  imageUrl?: string
): Promise<ApiResponse<CommunityMessage>> => {
  try {
    // Detect current language for the reply
    const currentLang = getCurrentLanguage();
    
    return await postMessage({
      content,
      image_url: imageUrl,
      parent_id: parentMessageId,
      lang: currentLang
    }, userId);
  } catch (error) {
    console.error('Error replying to message:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Like a message
 */
export const likeMessage = async (
  messageId: string,
  userId: string
): Promise<ApiResponse<CommunityLike>> => {
  try {
    const { data, error } = await supabase
      .from('community_likes')
      .insert([{
        user_id: userId,
        message_id: messageId
      }])
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate like error
      if (error.code === '23505') {
        throw new Error('You have already liked this message');
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error liking message:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Unlike a message
 */
export const unlikeMessage = async (
  messageId: string,
  userId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('community_likes')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId);

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    console.error('Error unliking message:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Check if user has liked a message
 */
export const hasUserLikedMessage = async (
  messageId: string,
  userId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const { data, error } = await supabase
      .from('community_likes')
      .select('like_id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return { data: !!data, error: null };
  } catch (error) {
    console.error('Error checking if user liked message:', error);
    return { data: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Toggle like/unlike for a message
 */
export const toggleLike = async (
  messageId: string,
  userId: string
): Promise<ApiResponse<{ liked: boolean; likeCount: number }>> => {
  try {
    const hasLiked = await hasUserLikedMessage(messageId, userId);
    
    if (hasLiked.error) {
      return { data: null, error: hasLiked.error };
    }

    if (hasLiked.data) {
      // Unlike the message
      const unlikeResult = await unlikeMessage(messageId, userId);
      if (unlikeResult.error) {
        return { data: null, error: unlikeResult.error };
      }
    } else {
      // Like the message
      const likeResult = await likeMessage(messageId, userId);
      if (likeResult.error) {
        return { data: null, error: likeResult.error };
      }
    }

    // Get updated like count
    const likeCount = await getMessageLikeCount(messageId);
    
    return { 
      data: { 
        liked: !hasLiked.data,
        likeCount: likeCount.data || 0
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error toggling like:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get like count for a message
 */
export const getMessageLikeCount = async (
  messageId: string
): Promise<ApiResponse<number>> => {
  try {
    const { count, error } = await supabase
      .from('community_likes')
      .select('*', { count: 'exact', head: true })
      .eq('message_id', messageId);

    if (error) throw error;
    return { data: count || 0, error: null };
  } catch (error) {
    console.error('Error getting like count:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Fetch all main posts (not replies) with user details and like counts
 * Enhanced with language awareness
 */
export const getAllMainPosts = async (
  limit: number = 50,
  offset: number = 0,
  languageAware: boolean = true
): Promise<ApiResponse<CommunityMessageWithDetailsAndLang[]>> => {
  try {
    const { data, error } = await supabase
      .from('community_messages_with_details')
      .select('*')
      .is('parent_id', null) // Only main posts, not replies
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    if (!languageAware || !data) {
      return { data: data || [], error: null };
    }

    // Add language context to messages
    const currentLang = getCurrentLanguage();
    const enhancedData = data.map(message => ({
      ...message,
      detected_language: 'en' as SupportedLanguage, // Default assumption
      requires_translation: currentLang !== 'en'
    }));

    console.log(`Fetched ${enhancedData.length} main posts for language: ${currentLang}`);
    
    return { data: enhancedData, error: null };
  } catch (error) {
    console.error('Error fetching main posts:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Fetch all messages (posts and replies) with user details and like counts
 */
export const getAllMessages = async (
  limit: number = 100,
  offset: number = 0
): Promise<ApiResponse<CommunityMessageWithDetails[]>> => {
  try {
    const { data, error } = await supabase
      .from('community_messages_with_details')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get replies for a specific message
 * Enhanced with language awareness
 */
export const getMessageReplies = async (
  parentMessageId: string,
  languageAware: boolean = true
): Promise<ApiResponse<CommunityMessageWithDetailsAndLang[]>> => {
  try {
    const { data, error } = await supabase
      .from('community_messages_with_details')
      .select('*')
      .eq('parent_id', parentMessageId)
      .order('created_at', { ascending: true }); // Replies in chronological order

    if (error) throw error;
    
    if (!languageAware || !data) {
      return { data: data || [], error: null };
    }

    // Add language context to replies
    const currentLang = getCurrentLanguage();
    const enhancedData = data.map(reply => ({
      ...reply,
      detected_language: 'en' as SupportedLanguage, // Default assumption
      requires_translation: currentLang !== 'en'
    }));

    console.log(`Fetched ${enhancedData.length} replies for message ${parentMessageId} in language: ${currentLang}`);
    
    return { data: enhancedData, error: null };
  } catch (error) {
    console.error('Error fetching message replies:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get a complete message thread (main post + all nested replies)
 */
export const getMessageThread = async (
  mainMessageId: string
): Promise<ApiResponse<CommunityMessageWithDetails[]>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_message_thread', { main_message_id: mainMessageId });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching message thread:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get messages by a specific user
 */
export const getUserMessages = async (
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ApiResponse<CommunityMessageWithDetails[]>> => {
  try {
    const { data, error } = await supabase
      .from('community_messages_with_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user messages:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Delete a message (only by the author)
 */
export const deleteMessage = async (
  messageId: string,
  userId: string
): Promise<ApiResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('community_messages')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId); // RLS will ensure only the author can delete

    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Update a message (only by the author)
 * Enhanced with language awareness
 */
export const updateMessage = async (
  messageId: string,
  userId: string,
  newContent: string,
  newImageUrl?: string
): Promise<ApiResponse<CommunityMessage>> => {
  try {
    if (!newContent || newContent.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (newContent.length > 2000) {
      throw new Error('Message content cannot exceed 2000 characters');
    }

    // Detect current language for the update
    const currentLang = getCurrentLanguage();

    const { data, error } = await supabase
      .from('community_messages')
      .update({
        content: newContent.trim(),
        image_url: newImageUrl || null
        // Note: Add lang column to database schema if you want to store language
        // lang: currentLang
      })
      .eq('message_id', messageId)
      .eq('user_id', userId) // RLS will ensure only the author can update
      .select()
      .single();

    if (error) throw error;
    
    // Log language info for debugging
    console.log(`Message ${messageId} updated in language: ${currentLang}`);
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating message:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get community statistics
 */
export const getCommunityStats = async (): Promise<ApiResponse<{
  totalMessages: number;
  totalMainPosts: number;
  totalReplies: number;
  totalLikes: number;
  activeUsers: number;
}>> => {
  try {
    // Get total messages
    const { count: totalMessages } = await supabase
      .from('community_messages')
      .select('*', { count: 'exact', head: true });

    // Get main posts count
    const { count: totalMainPosts } = await supabase
      .from('community_messages')
      .select('*', { count: 'exact', head: true })
      .is('parent_id', null);

    // Get replies count
    const { count: totalReplies } = await supabase
      .from('community_messages')
      .select('*', { count: 'exact', head: true })
      .not('parent_id', 'is', null);

    // Get total likes
    const { count: totalLikes } = await supabase
      .from('community_likes')
      .select('*', { count: 'exact', head: true });

    // Get active users (users who have posted at least one message)
    const { data: activeUsersData } = await supabase
      .from('community_messages')
      .select('user_id')
      .not('user_id', 'is', null);

    const uniqueUsers = new Set(activeUsersData?.map(item => item.user_id) || []);

    return {
      data: {
        totalMessages: totalMessages || 0,
        totalMainPosts: totalMainPosts || 0,
        totalReplies: totalReplies || 0,
        totalLikes: totalLikes || 0,
        activeUsers: uniqueUsers.size
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Search messages by content
 */
export const searchMessages = async (
  searchTerm: string,
  limit: number = 50
): Promise<ApiResponse<CommunityMessageWithDetails[]>> => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error('Search term must be at least 2 characters long');
    }

    const { data, error } = await supabase
      .from('community_messages_with_details')
      .select('*')
      .textSearch('content', searchTerm.trim())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error searching messages:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Utility function to get current language (exposed for components)
 */
export const getActiveLanguage = getCurrentLanguage;

/**
 * Check if current language is supported
 */
export const isLanguageSupported = (lang: string): lang is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
};

/**
 * Get list of supported languages
 */
export const getSupportedLanguages = (): readonly SupportedLanguage[] => {
  return SUPPORTED_LANGUAGES;
};

// Export all functions
export const communityClient = {
  // Message operations
  postMessage,
  replyToMessage,
  getAllMainPosts,
  getAllMessages,
  getMessageReplies,
  getMessageThread,
  getUserMessages,
  updateMessage,
  deleteMessage,
  searchMessages,

  // Like operations
  likeMessage,
  unlikeMessage,
  hasUserLikedMessage,
  toggleLike,
  getMessageLikeCount,

  // Stats and utilities
  getCommunityStats,

  // Language utilities
  getActiveLanguage,
  isLanguageSupported,
  getSupportedLanguages
};

export default communityClient;
