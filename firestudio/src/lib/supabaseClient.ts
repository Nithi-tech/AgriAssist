// ============================================================================
// SUPABASE CLIENT CONFIGURATION
// Proper Supabase client initialization with environment variables
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables with fallbacks for build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo_key'

// Validate environment variables (only warn in production)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client
let supabaseClient: SupabaseClient

try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We're not using auth for this app
    },
  })
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ Supabase client initialized successfully')
    console.log('🔗 Connected to:', supabaseUrl)
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error)
  throw new Error(`Failed to initialize Supabase client: ${error}`)
}

// Export the client
export const supabase = supabaseClient

// Legacy aliases for backward compatibility
export const supabaseAdmin = supabaseClient
export const supabaseClient_export = supabaseClient

// Export configuration for debugging
export const config = {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  isInitialized: !!supabaseClient,
}

// Helper function to check if client is properly initialized
export const isSupabaseReady = (): boolean => {
  const ready = !!(supabaseClient && supabaseUrl && supabaseAnonKey)
  if (!ready) {
    console.error('❌ Supabase client is not properly initialized')
    console.log('Debug info:', {
      hasClient: !!supabaseClient,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
  }
  return ready
}

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
      crops: {
        Row: {
          id: number
          crop_name: string
          crop_variety: string | null
          planting_date: string | null
          expected_harvest_date: string | null
          location: string | null
          land_size: number | null
          land_size_unit: string | null
          irrigation_type: string | null
          soil_type: string | null
          water_source: string | null
          status: string | null
          season: string | null
          farming_method: string | null
          estimated_yield: number | null
          yield_unit: string | null
          cost_investment: number | null
          fertilizer_used: string | null
          pesticide_used: string | null
          notes: string | null
          actual_yield: number | null
          revenue: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          crop_name: string
          crop_variety?: string | null
          planting_date?: string | null
          expected_harvest_date?: string | null
          location?: string | null
          land_size?: number | null
          land_size_unit?: string | null
          irrigation_type?: string | null
          soil_type?: string | null
          water_source?: string | null
          status?: string | null
          season?: string | null
          farming_method?: string | null
          estimated_yield?: number | null
          yield_unit?: string | null
          cost_investment?: number | null
          fertilizer_used?: string | null
          pesticide_used?: string | null
          notes?: string | null
          actual_yield?: number | null
          revenue?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          crop_name?: string
          crop_variety?: string | null
          planting_date?: string | null
          expected_harvest_date?: string | null
          location?: string | null
          land_size?: number | null
          land_size_unit?: string | null
          irrigation_type?: string | null
          soil_type?: string | null
          water_source?: string | null
          status?: string | null
          season?: string | null
          farming_method?: string | null
          estimated_yield?: number | null
          yield_unit?: string | null
          cost_investment?: number | null
          fertilizer_used?: string | null
          pesticide_used?: string | null
          notes?: string | null
          actual_yield?: number | null
          revenue?: number | null
          created_at?: string
          updated_at?: string
        }
      }
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
