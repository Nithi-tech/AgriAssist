// Chat system type definitions
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'audio';
  likes: number;
  created_at: string;
  audio_url?: string;
  audio_duration?: number; // in seconds
  // Join data
  sender?: User;
  is_liked_by_user?: boolean;
  liked_by_user?: boolean;
}

export interface MessageLike {
  id: string;
  message_id: string;
  user_id: string;
  created_at: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

// Supabase database schema types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          avatar?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          content: string;
          type: 'text' | 'audio';
          likes: number;
          created_at: string;
          audio_url?: string;
          audio_duration?: number;
        };
        Insert: {
          id?: string;
          sender_id: string;
          content: string;
          type: 'text' | 'audio';
          likes?: number;
          created_at?: string;
          audio_url?: string;
          audio_duration?: number;
        };
        Update: {
          id?: string;
          sender_id?: string;
          content?: string;
          type?: 'text' | 'audio';
          likes?: number;
          created_at?: string;
          audio_url?: string;
          audio_duration?: number;
        };
      };
      message_likes: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
  };
}
