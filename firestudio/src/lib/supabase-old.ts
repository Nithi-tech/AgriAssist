// Mock Supabase - No database connections
// This file replaces Supabase with mock functionality

// Mock client object that matches Supabase API
const mockSupabaseClient = {
  // Mock auth methods
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ 
      data: { user: null, session: null }, 
      error: { message: 'Mock auth not implemented' } 
    }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback) => {
      // Mock auth state change subscription
      const subscription = {
        unsubscribe: () => console.log('Mock auth subscription unsubscribed')
      };
      // Call callback immediately with no session
      setTimeout(() => callback('SIGNED_OUT', null), 0);
      return { data: { subscription } };
    }
  },
  
  // Mock database operations
  from: (table) => ({
    select: (columns = '*') => ({
      eq: (column, value) => ({
        single: () => Promise.resolve({ 
          data: null, 
          error: { code: 'PGRST116', message: 'Mock: No data found' } 
        }),
        order: (orderColumn, options) => ({
          limit: (count) => Promise.resolve({ data: [], error: null }),
          then: (callback) => callback({ data: [], error: null })
        }),
        limit: (count) => Promise.resolve({ data: [], error: null }),
        then: (callback) => callback({ data: [], error: null })
      }),
      order: (column, options) => ({
        limit: (count) => Promise.resolve({ data: [], error: null }),
        then: (callback) => callback({ data: [], error: null })
      }),
      or: (query) => ({
        order: (column, options) => ({
          limit: (count) => Promise.resolve({ data: [], error: null })
        }),
        then: (callback) => callback({ data: [], error: null })
      }),
      ilike: (column, pattern) => ({
        order: (column, options) => ({
          limit: (count) => Promise.resolve({ data: [], error: null })
        }),
        then: (callback) => callback({ data: [], error: null })
      }),
      limit: (count) => Promise.resolve({ data: [], error: null }),
      then: (callback) => callback({ data: [], error: null })
    }),
    insert: (data) => ({
      select: () => Promise.resolve({ 
        data: Array.isArray(data) ? data.map(item => ({ ...item, id: Math.random().toString() })) : [{ ...data, id: Math.random().toString() }], 
        error: null 
      }),
      then: (callback) => callback({ 
        data: Array.isArray(data) ? data.map(item => ({ ...item, id: Math.random().toString() })) : [{ ...data, id: Math.random().toString() }], 
        error: null 
      })
    }),
    update: (data) => ({
      eq: (column, value) => ({
        select: () => Promise.resolve({ data: [{ ...data, id: value }], error: null }),
        then: (callback) => callback({ data: [{ ...data, id: value }], error: null })
      })
    }),
    delete: () => ({
      eq: (column, value) => Promise.resolve({ data: [], error: null }),
      then: (callback) => callback({ data: [], error: null })
    }),
    upsert: (data) => ({
      select: () => Promise.resolve({ 
        data: Array.isArray(data) ? data : [data], 
        error: null 
      })
    })
  }),
  
  // Mock storage
  storage: {
    from: (bucket) => ({
      upload: (path, file, options) => Promise.resolve({ 
        data: { path: `mock/${path}` }, 
        error: null 
      }),
      getPublicUrl: (path) => ({ 
        data: { publicUrl: `https://mock-storage.com/${path}` } 
      }),
      download: (path) => Promise.resolve({ 
        data: new Blob(['mock file content']), 
        error: null 
      }),
      remove: (paths) => Promise.resolve({ data: [], error: null })
    })
  },

  // Mock realtime
  channel: (name) => ({
    on: (event, filter, callback) => ({
      subscribe: () => Promise.resolve('SUBSCRIBED')
    }),
    unsubscribe: () => Promise.resolve('UNSUBSCRIBED'),
    send: (event, payload) => Promise.resolve('ok')
  }),

  // Mock RPC
  rpc: (functionName, params) => Promise.resolve({ 
    data: null, 
    error: { message: `Mock RPC: ${functionName} not implemented` } 
  })
};

// Client for browser/app usage (with RLS enabled)
export const supabase = mockSupabaseClient;

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = mockSupabaseClient;

// Legacy client alias for backward compatibility
export const supabaseClient = supabase;

// Mock configuration
export const supabaseUrl = 'https://mock-supabase-url.com';
export const supabaseAnonKey = 'mock-anon-key';
export const supabaseServiceKey = 'mock-service-key';

console.log('🎭 Using mock Supabase - no database connections');

// Type definitions for better TypeScript support
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
