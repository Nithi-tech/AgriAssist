// Mock Supabase Client - No database connections
// This file replaces Supabase with mock functionality

// Mock client object that matches Supabase API
export const supabase = {
  // Mock auth methods
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Mock auth not implemented' } }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } }
    })
  },
  
  // Mock database operations
  from: (table) => ({
    select: (columns = '*') => ({
      eq: (column, value) => ({
        single: () => Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Mock: No data found' } }),
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        }),
        then: (callback) => callback({ data: [], error: null })
      }),
      order: (column, options) => ({
        limit: (count) => Promise.resolve({ data: [], error: null }),
        then: (callback) => callback({ data: [], error: null })
      }),
      or: (query) => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [], error: null })
        })
      }),
      limit: (count) => Promise.resolve({ data: [], error: null }),
      then: (callback) => callback({ data: [], error: null })
    }),
    insert: (data) => ({
      select: () => Promise.resolve({ data: [{ ...data, id: Math.random().toString() }], error: null }),
      then: (callback) => callback({ data: [{ ...data, id: Math.random().toString() }], error: null })
    }),
    update: (data) => ({
      eq: (column, value) => ({
        select: () => Promise.resolve({ data: [data], error: null })
      })
    }),
    delete: () => ({
      eq: (column, value) => Promise.resolve({ data: [], error: null })
    })
  }),
  
  // Mock storage
  storage: {
    from: (bucket) => ({
      upload: () => Promise.resolve({ data: null, error: { message: 'Mock storage not implemented' } }),
      getPublicUrl: () => ({ data: { publicUrl: 'https://mock-url.com/image.jpg' } })
    })
  }
};

// Mock admin client (for server-side operations)
export const supabaseAdmin = supabase;

// Default export for compatibility
export default supabase;

console.log('🎭 Using mock Supabase client - no database connections');
