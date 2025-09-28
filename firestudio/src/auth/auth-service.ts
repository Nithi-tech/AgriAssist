/**
 * Mock OTP Authentication Service
 * Handles OTP generation, sending, and verification without database
 */

import crypto from 'crypto';

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

// In-memory storage for mock data
let mockUsers: User[] = [
  {
    id: '1',
    mobile_number: '+919876543210',
    name: 'John Farmer',
    location: {
      address: '123 Farm Road',
      city: 'Nashik',
      state: 'Maharashtra',
      country: 'India',
      lat: 19.9975,
      lng: 73.7898
    },
    is_verified: true,
    last_login: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    mobile_number: '+919876543211',
    name: 'Priya Singh',
    is_verified: true,
    last_login: new Date().toISOString(),
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

let mockOTPRecords: OTPRecord[] = [];

export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Check if mobile number exists in mock database
   */
  async checkMobileExists(mobileNumber: string): Promise<{ exists: boolean; user?: User }> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const user = mockUsers.find(u => u.mobile_number === mobileNumber);
      
      return {
        exists: !!user,
        user: user || undefined
      };
    } catch (error) {
      console.error('Error checking mobile number:', error);
      throw new Error('Failed to check mobile number');
    }
  }

  /**
   * Generate secure 6-digit OTP string
   */
  private generateOTPString(): string {
    const length = parseInt(process.env.OTP_LENGTH || '6');
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  /**
   * Hash OTP for secure storage
   */
  private hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp + process.env.OTP_SECRET || 'default_secret').digest('hex');
  }

  /**
   * Verify OTP hash
   */
  private verifyOTPHash(otp: string, hash: string): boolean {
    const computedHash = this.hashOTP(otp);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  }

  /**
   * Generate and store OTP
   */
  async generateOTP(mobileNumber: string, purpose: 'login' | 'signup' = 'login'): Promise<{ otp: string; recordId: string }> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clean up expired OTPs
      const now = new Date();
      mockOTPRecords = mockOTPRecords.filter(record => new Date(record.expires_at) > now);
      
      // Generate new OTP
      const otp = this.generateOTPString();
      const otpHash = this.hashOTP(otp);
      const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000));
      
      // Create OTP record
      const otpRecord: OTPRecord = {
        id: crypto.randomUUID(),
        mobile_number: mobileNumber,
        otp_hash: otpHash,
        attempts: 0,
        expires_at: expiresAt.toISOString(),
        is_used: false,
        purpose,
        created_at: new Date().toISOString()
      };
      
      // Store in mock database
      mockOTPRecords.push(otpRecord);
      
      console.log(`Generated OTP for ${mobileNumber}: ${otp} (Mock - expires at ${expiresAt})`);
      
      return {
        otp,
        recordId: otpRecord.id
      };
    } catch (error) {
      console.error('Error generating OTP:', error);
      throw new Error('Failed to generate OTP');
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(mobileNumber: string, otp: string, purpose?: 'login' | 'signup'): Promise<AuthResponse> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Find the most recent non-used OTP for this mobile number
      const otpRecord = mockOTPRecords
        .filter(record => 
          record.mobile_number === mobileNumber && 
          !record.is_used &&
          new Date(record.expires_at) > new Date() &&
          (!purpose || record.purpose === purpose)
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (!otpRecord) {
        return {
          success: false,
          message: 'Invalid or expired OTP'
        };
      }

      // Check attempts limit
      if (otpRecord.attempts >= parseInt(process.env.OTP_MAX_ATTEMPTS || '3')) {
        return {
          success: false,
          message: 'Maximum OTP attempts exceeded. Please request a new OTP'
        };
      }

      // Increment attempts
      otpRecord.attempts++;

      // Verify OTP
      if (!this.verifyOTPHash(otp, otpRecord.otp_hash)) {
        return {
          success: false,
          message: 'Invalid OTP'
        };
      }

      // Mark OTP as used
      otpRecord.is_used = true;

      // Check if user exists for login
      const { exists, user } = await this.checkMobileExists(mobileNumber);
      
      if (purpose === 'login' && !exists) {
        return {
          success: false,
          message: 'User not found. Please register first'
        };
      }

      return {
        success: true,
        message: 'OTP verified successfully',
        data: user || { mobile_number: mobileNumber }
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw new Error('Failed to verify OTP');
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
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if user already exists
      const { exists } = await this.checkMobileExists(userData.mobile_number);
      if (exists) {
        return {
          success: false,
          message: 'User already exists with this mobile number'
        };
      }

      // Create new user
      const newUser: User = {
        id: crypto.randomUUID(),
        mobile_number: userData.mobile_number,
        name: userData.name,
        location: userData.location,
        is_verified: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to mock database
      mockUsers.push(newUser);

      console.log('User registered successfully:', newUser.mobile_number);

      return {
        success: true,
        message: 'User registered successfully',
        data: newUser
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw new Error('Failed to register user');
    }
  }

  /**
   * Update user's last login
   */
  async updateLastLogin(mobileNumber: string): Promise<void> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const userIndex = mockUsers.findIndex(u => u.mobile_number === mobileNumber);
      if (userIndex !== -1) {
        mockUsers[userIndex].last_login = new Date().toISOString();
        mockUsers[userIndex].updated_at = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Get user by mobile number
   */
  async getUserByMobile(mobileNumber: string): Promise<User | null> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return mockUsers.find(u => u.mobile_number === mobileNumber) || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(mobileNumber: string, updates: Partial<User>): Promise<AuthResponse> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const userIndex = mockUsers.findIndex(u => u.mobile_number === mobileNumber);
      if (userIndex === -1) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Update user data
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };

      return {
        success: true,
        message: 'Profile updated successfully',
        data: mockUsers[userIndex]
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Clean up expired OTPs (utility method)
   */
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      const now = new Date();
      const beforeCount = mockOTPRecords.length;
      mockOTPRecords = mockOTPRecords.filter(record => new Date(record.expires_at) > now);
      const removedCount = beforeCount - mockOTPRecords.length;
      
      if (removedCount > 0) {
        console.log(`Cleaned up ${removedCount} expired OTP records`);
      }
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }

  /**
   * Get mock data for testing/debugging
   */
  async getMockData(): Promise<{ users: User[]; otpRecords: OTPRecord[] }> {
    return {
      users: [...mockUsers],
      otpRecords: [...mockOTPRecords]
    };
  }

  /**
   * Get user by ID (required by middleware)
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 50));
      
      return mockUsers.find(u => u.id === id) || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  /**
   * Verify token (required by middleware)
   */
  async verifyToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      // Mock token verification - in real implementation, verify JWT
      // For mock, we'll accept any token that looks like a valid format
      if (token && token.length > 10) {
        // Return a mock user ID
        return {
          valid: true,
          userId: mockUsers[0]?.id || '1'
        };
      }
      
      return { valid: false };
    } catch (error) {
      console.error('Error verifying token:', error);
      return { valid: false };
    }
  }
}
