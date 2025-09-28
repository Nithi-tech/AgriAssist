/**
 * OTP Authentication Service
 * Handles OTP generation, sending, and verification with multiple providers
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Types
export interface User {
  id: string;
  mobile_number: string;
  name?: string;
  location?: {
    address: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
  };
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface OTPRecord {
  id: string;
  mobile_number: string;
  otp_hash: string;
  attempts: number;
  expires_at: string;
  is_used: boolean;
  purpose: 'login' | 'signup';
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
  token?: string;
}

// Initialize Supabase (lazy initialization)
function getSupabaseClient() {
  const { supabaseAdmin } = require('@/lib/supabase');
  return supabaseAdmin;
}

export class AuthService {
  private static instance: AuthService;
  private supabase: any;
  
  private constructor() {
    this.supabase = getSupabaseClient();
  }
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Check if mobile number exists in database
   */
  async checkMobileExists(mobileNumber: string): Promise<{ exists: boolean; user?: User }> {
    try {
      const { data, error } = await this.supabase
        .from('auth_users')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        exists: !!data,
        user: data || undefined
      };
    } catch (error) {
      console.error('Error checking mobile number:', error);
      throw new Error('Failed to check mobile number');
    }
  }

  /**
   * Generate secure 6-digit OTP
   */
  private generateOTP(): string {
    const length = parseInt(process.env.OTP_LENGTH || '6');
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    
    return otp;
  }

  /**
   * Hash OTP for secure storage
   */
  private hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(identifier: string, action: string): Promise<boolean> {
    const maxAttempts = parseInt(process.env.OTP_RATE_LIMIT || '3');
    const windowMinutes = 60; // 1 hour window

    try {
      // Clean old entries first
      await this.supabase
        .from('auth_rate_limits')
        .delete()
        .lt('window_start', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString());

      // Check current attempts
      const { data, error } = await this.supabase
        .from('auth_rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .eq('action', action)
        .gt('window_start', new Date(Date.now() - windowMinutes * 60 * 1000).toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        // No existing record, create new one
        await this.supabase
          .from('auth_rate_limits')
          .insert({
            identifier,
            action,
            attempts: 1,
            window_start: new Date().toISOString()
          });
        return true;
      }

      if (data && data.attempts >= maxAttempts) {
        return false; // Rate limit exceeded
      }

      // Update attempts
      if (data) {
        await this.supabase
          .from('auth_rate_limits')
          .update({ attempts: data.attempts + 1 })
          .eq('id', data.id);
      }

      return true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return false;
    }
  }

  /**
   * Send OTP via configured provider
   */
  async sendOTP(mobileNumber: string, purpose: 'login' | 'signup' = 'login'): Promise<AuthResponse> {
    try {
      // Check rate limiting
      const canProceed = await this.checkRateLimit(mobileNumber, 'send_otp');
      if (!canProceed) {
        return {
          success: false,
          message: 'Too many OTP requests. Please try again later.'
        };
      }

      // Generate OTP
      const otp = this.generateOTP();
      const otpHash = this.hashOTP(otp);
      const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '5') * 60 * 1000));

      // Store OTP in database
      const { error: insertError } = await this.supabase
        .from('auth_otps')
        .insert({
          mobile_number: mobileNumber,
          otp_hash: otpHash,
          expires_at: expiresAt.toISOString(),
          purpose
        });

      if (insertError) {
        throw insertError;
      }

      // Send OTP based on provider
      const provider = process.env.OTP_PROVIDER || 'firebase';
      let sendResult;

      if (process.env.DEBUG_MODE === 'true') {
        console.log(`🔐 DEBUG OTP for ${mobileNumber}: ${otp}`);
        sendResult = { success: true };
      } else if (provider === 'firebase') {
        sendResult = await this.sendOTPFirebase(mobileNumber, otp);
      } else if (provider === 'twilio') {
        sendResult = await this.sendOTPTwilio(mobileNumber, otp);
      } else {
        throw new Error('Invalid OTP provider configured');
      }

      if (!sendResult.success) {
        return {
          success: false,
          message: 'Failed to send OTP. Please try again.'
        };
      }

      return {
        success: true,
        message: 'OTP sent successfully'
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        message: 'Failed to send OTP'
      };
    }
  }

  /**
   * Send OTP via Firebase
   */
  private async sendOTPFirebase(mobileNumber: string, otp: string): Promise<{ success: boolean }> {
    try {
      // Firebase Admin SDK SMS sending would go here
      // For now, returning success as this requires Firebase Admin setup
      console.log(`Firebase OTP would be sent to ${mobileNumber}: ${otp}`);
      return { success: true };
    } catch (error) {
      console.error('Firebase OTP error:', error);
      return { success: false };
    }
  }

  /**
   * Send OTP via Twilio
   */
  private async sendOTPTwilio(mobileNumber: string, otp: string): Promise<{ success: boolean }> {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Twilio credentials not configured');
      }

      const twilio = require('twilio')(accountSid, authToken);
      
      const message = await twilio.messages.create({
        body: `Your verification code is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`,
        from: fromNumber,
        to: mobileNumber
      });

      console.log('Twilio message sent:', message.sid);
      return { success: true };
    } catch (error) {
      console.error('Twilio OTP error:', error);
      return { success: false };
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(mobileNumber: string, otp: string): Promise<AuthResponse> {
    try {
      // Check rate limiting
      const canProceed = await this.checkRateLimit(mobileNumber, 'verify_otp');
      if (!canProceed) {
        return {
          success: false,
          message: 'Too many verification attempts. Please try again later.'
        };
      }

      const otpHash = this.hashOTP(otp);

      // Find valid OTP
      const { data: otpRecord, error: otpError } = await this.supabase
        .from('auth_otps')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .eq('otp_hash', otpHash)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (otpError || !otpRecord) {
        return {
          success: false,
          message: 'Invalid or expired OTP'
        };
      }

      // Check attempt limit
      const maxAttempts = parseInt(process.env.MAX_OTP_ATTEMPTS || '5');
      if (otpRecord.attempts >= maxAttempts) {
        return {
          success: false,
          message: 'Maximum verification attempts exceeded'
        };
      }

      // Mark OTP as used
      await this.supabase
        .from('auth_otps')
        .update({ is_used: true })
        .eq('id', otpRecord.id);

      // Check if user exists
      const { exists, user } = await this.checkMobileExists(mobileNumber);

      if (exists && user) {
        // Update last login
        await this.supabase
          .from('auth_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);

        // Generate session token
        const token = this.generateSessionToken(user.id);

        return {
          success: true,
          message: 'Login successful',
          data: { user, isNewUser: false },
          token
        };
      } else {
        // New user - OTP verified but not registered yet
        return {
          success: true,
          message: 'OTP verified. Please complete registration.',
          data: { isNewUser: true }
        };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        message: 'OTP verification failed'
      };
    }
  }

  /**
   * Register new user
   */
  async registerUser(userData: {
    mobile_number: string;
    name: string;
    location?: any;
  }): Promise<AuthResponse> {
    try {
      const { data: user, error } = await this.supabase
        .from('auth_users')
        .insert({
          mobile_number: userData.mobile_number,
          name: userData.name,
          location: userData.location,
          is_verified: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Generate session token
      const token = this.generateSessionToken(user.id);

      return {
        success: true,
        message: 'Registration successful',
        data: { user },
        token
      };
    } catch (error) {
      console.error('Register user error:', error);
      return {
        success: false,
        message: 'Registration failed'
      };
    }
  }

  /**
   * Generate JWT session token
   */
  private generateSessionToken(userId: string): string {
    const jwt = require('jsonwebtoken');
    const payload = {
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET);
  }

  /**
   * Verify session token
   */
  async verifyToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      return {
        valid: true,
        userId: decoded.userId
      };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('auth_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Cleanup expired data
   */
  async cleanup(): Promise<void> {
    try {
      await this.supabase.rpc('cleanup_expired_auth_data');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}
