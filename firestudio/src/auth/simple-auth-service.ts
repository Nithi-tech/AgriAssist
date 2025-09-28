/**
 * Simple Authentication Service for Build Time
 * Provides minimal auth functionality without Supabase initialization at import time
 */

import { NextResponse } from 'next/server';

export interface AuthResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  token?: string;
  session_id?: string;
}

export interface UserData {
  id: string;
  mobile_number: string;
  name?: string;
  email?: string;
  is_verified?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private getSupabase() {
    try {
      const { supabaseAdmin } = require('@/lib/supabase');
      return supabaseAdmin;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return null;
    }
  }

  /**
   * Check if a user exists by mobile number (extended version)
   */
  async checkMobileExists(mobile_number: string): Promise<{ exists: boolean; user?: UserData }> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) return { exists: false };

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('mobile_number', mobile_number)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking mobile existence:', error);
        return { exists: false };
      }

      return {
        exists: !!data,
        user: data || undefined
      };
    } catch (error) {
      console.error('Error checking mobile existence:', error);
      return { exists: false };
    }
  }

  /**
   * Check if a user exists by mobile number
   */
  async checkUserExists(mobile_number: string): Promise<boolean> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) return false;

      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('mobile_number', mobile_number)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Send OTP to mobile number
   */
  async sendOTP(mobile_number: string, purpose: string = 'login'): Promise<AuthResult> {
    try {
      // Mock OTP sending for now
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const session_id = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      console.log(`📱 Mock OTP for ${mobile_number}: ${otp} (Purpose: ${purpose})`);
      
      return {
        success: true,
        message: 'OTP sent successfully',
        session_id,
        data: {
          mobile_number,
          expires_in: 300,
          purpose
        }
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(mobile_number: string, otp: string, session_id?: string): Promise<AuthResult> {
    try {
      // Mock OTP verification for now
      console.log(`🔍 Mock OTP verification for ${mobile_number}: ${otp}`);
      
      return {
        success: true,
        message: 'OTP verified successfully',
        token: `mock_token_${Date.now()}`,
        data: {
          user_id: `user_${mobile_number}`,
          mobile_number
        }
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'OTP verification failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
    try {
      // Mock token verification for now
      if (token.startsWith('mock_token_')) {
        return {
          valid: true,
          userId: 'mock_user_id'
        };
      }
      
      return {
        valid: false,
        error: 'Invalid token'
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserData | null> {
    try {
      const supabase = this.getSupabase();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}

export default AuthService;
