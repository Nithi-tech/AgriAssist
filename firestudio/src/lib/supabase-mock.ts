// ============================================================================
// SUPABASE CLIENT CONFIGURATION
// Real Supabase integration for production use
// ============================================================================

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
export const supabaseUrl = 'https://ngexxcdvfwpdqkvwnbip.supabase.co'
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nZXh4Y2R2ZndwZHFrdnduYmlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTA3NjYsImV4cCI6MjA3MTA2Njc2Nn0.SoNmJMX2tLNa_GcwoH0hJZ4snAFHDK03nGencZFGlus'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Legacy aliases for backward compatibility
export const supabaseClient = supabase
export const supabaseAdmin = supabase

console.log('🚀 Connected to Supabase at:', supabaseUrl)

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
