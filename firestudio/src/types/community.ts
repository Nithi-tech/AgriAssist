// Database types for the farmer community chat
export type DbMessage = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: { id: string; user_metadata?: any; email?: string }; // optional join
  like_count?: number;
  replies?: DbReply[];
};

export type DbReply = {
  id: string;
  message_id: string;
  user_id: string;
  reply_content: string;
  created_at: string;
  user?: { id: string; user_metadata?: any; email?: string };
};

export type DbLike = {
  id: string;
  message_id: string;
  user_id: string;
  created_at: string;
};

// UI state types
export type MessageWithState = DbMessage & {
  isLiked: boolean;
  showReplyInput: boolean;
};

// Realtime payload types
export type RealtimePayload<T = any> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  table: string;
};
