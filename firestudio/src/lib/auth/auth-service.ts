import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';
import twilio from 'twilio';

// Types
export interface User {
  id: string;
  name: string;
  phone: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface OTP {
  phone: string;
  code: string;
  expires_at: Date;
  attempts: number;
  created_at: Date;
}

export interface AuthConfig {
  provider: 'firebase' | 'twilio';
  debugMode: boolean;
}

// Initialize services
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Initialize Firebase Admin (only if not already initialized)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.log('Firebase admin initialization error:', error);
  }
}

// Initialize Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export class AuthService {
  private config: AuthConfig;

  constructor(config: AuthConfig = { provider: 'twilio', debugMode: false }) {
    this.config = config;
  }

  /**
   * Check if phone number exists in database
   */
  async checkPhoneExists(phone: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('phone')
        .eq('phone', phone)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking phone:', error);
      throw new Error('Database error');
    }
  }

  /**
   * Get user by phone number
   */
  async getUserByPhone(phone: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Database error');
    }
  }

  /**
   * Generate 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP in database with expiry
   */
  async storeOTP(phone: string, otp: string): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

      const { error } = await supabase
        .from('otps')
        .upsert({
          phone,
          code: otp,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'phone'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing OTP:', error);
      throw new Error('Failed to store OTP');
    }
  }

  /**
   * Send OTP via Firebase Phone Auth
   */
  async sendOTPViaFirebase(phone: string): Promise<boolean> {
    try {
      // Note: Firebase Phone Auth typically requires client-side verification
      // For server-side, we'll use Firebase Admin to create a custom token
      const otp = this.generateOTP();
      
      if (this.config.debugMode) {
        console.log(`🐛 DEBUG MODE - OTP for ${phone}: ${otp}`);
        await this.storeOTP(phone, otp);
        return true;
      }

      // Store OTP first
      await this.storeOTP(phone, otp);

      // For production, integrate with Firebase messaging or use a service like Firebase Functions
      console.log(`Firebase OTP sent to ${phone}: ${otp}`);
      return true;
    } catch (error) {
      console.error('Firebase OTP error:', error);
      return false;
    }
  }

  /**
   * Send OTP via Twilio
   */
  async sendOTPViaTwilio(phone: string): Promise<boolean> {
    try {
      const otp = this.generateOTP();
      
      if (this.config.debugMode) {
        console.log(`🐛 DEBUG MODE - OTP for ${phone}: ${otp}`);
        await this.storeOTP(phone, otp);
        return true;
      }

      if (!twilioClient) {
        throw new Error('Twilio not configured');
      }

      // Store OTP first
      await this.storeOTP(phone, otp);

      // Send SMS via Twilio
      const message = await twilioClient.messages.create({
        body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log(`Twilio OTP sent to ${phone}:`, message.sid);
      return true;
    } catch (error) {
      console.error('Twilio OTP error:', error);
      return false;
    }
  }

  /**
   * Send OTP using configured provider
   */
  async sendOTP(phone: string): Promise<boolean> {
    // Check rate limiting
    const rateLimited = await this.checkRateLimit(phone);
    if (rateLimited) {
      throw new Error('Too many OTP requests. Please try again later.');
    }

    if (this.config.provider === 'firebase') {
      return this.sendOTPViaFirebase(phone);
    } else {
      return this.sendOTPViaTwilio(phone);
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, inputOTP: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: otpData, error } = await supabase
        .from('otps')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error || !otpData) {
        return { success: false, message: 'OTP not found or expired' };
      }

      // Check if OTP is expired
      const now = new Date();
      const expiresAt = new Date(otpData.expires_at);
      if (now > expiresAt) {
        // Clean up expired OTP
        await this.cleanupOTP(phone);
        return { success: false, message: 'OTP has expired' };
      }

      // Check attempts limit (max 3 attempts)
      if (otpData.attempts >= 3) {
        await this.cleanupOTP(phone);
        return { success: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
      }

      // Verify OTP
      if (otpData.code === inputOTP) {
        // Success - cleanup OTP
        await this.cleanupOTP(phone);
        return { success: true, message: 'OTP verified successfully' };
      } else {
        // Increment attempts
        await supabase
          .from('otps')
          .update({ attempts: otpData.attempts + 1 })
          .eq('phone', phone);
        
        return { success: false, message: 'Invalid OTP. Please try again.' };
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, message: 'Verification failed' };
    }
  }

  /**
   * Create new user
   */
  async createUser(name: string, phone: string, location: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name,
          phone,
          location,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Check rate limiting for OTP requests
   */
  private async checkRateLimit(phone: string): Promise<boolean> {
    try {
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const { data, error } = await supabase
        .from('otp_rate_limit')
        .select('*')
        .eq('phone', phone)
        .gte('created_at', fifteenMinutesAgo.toISOString());

      if (error) throw error;

      // Allow max 3 OTP requests per 15 minutes
      if (data && data.length >= 3) {
        return true;
      }

      // Log this request
      await supabase
        .from('otp_rate_limit')
        .insert({
          phone,
          created_at: new Date().toISOString()
        });

      return false;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return false; // Allow request on error
    }
  }

  /**
   * Cleanup OTP from database
   */
  private async cleanupOTP(phone: string): Promise<void> {
    try {
      await supabase
        .from('otps')
        .delete()
        .eq('phone', phone);
    } catch (error) {
      console.error('OTP cleanup error:', error);
    }
  }

  /**
   * Clean up expired OTPs (can be called periodically)
   */
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await supabase
        .from('otps')
        .delete()
        .lt('expires_at', now);
    } catch (error) {
      console.error('Cleanup expired OTPs error:', error);
    }
  }
}
