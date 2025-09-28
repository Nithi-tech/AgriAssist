export interface OTPSession {
  id: string;
  phoneNumber: string;
  hashedOTP: string;
  salt: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
  isVerified: boolean;
  provider: 'firebase' | 'twilio';
  verificationId?: string; // For Firebase
  serviceSid?: string; // For Twilio
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  metadata?: Record<string, any>;
}

export interface AuthSession {
  id: string;
  userId: string;
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
  isActive: boolean;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    location?: string;
  };
}

export interface OTPRequest {
  phoneNumber: string;
  countryCode?: string;
  isNewUser?: boolean;
}

export interface OTPVerification {
  phoneNumber: string;
  otp: string;
  verificationId?: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  data?: {
    sessionToken?: string;
    user?: UserProfile;
    expiresAt?: Date;
  };
  error?: {
    code: string;
    details?: any;
  };
}

export interface SendOTPResult {
  success: boolean;
  message: string;
  verificationId?: string;
  expiresAt?: Date;
  remainingAttempts?: number;
  error?: {
    code: string;
    details?: any;
  };
}

export interface VerifyOTPResult extends AuthResult {
  isNewUser?: boolean;
}

// Provider-specific interfaces
export interface FirebaseOTPResponse {
  success: boolean;
  verificationId?: string;
  error?: any;
}

export interface TwilioOTPResponse {
  success: boolean;
  sid?: string;
  error?: any;
}

// Database schemas
export interface OTPRecord {
  id: string;
  phone_number: string;
  hashed_otp: string;
  salt: string;
  attempts: number;
  created_at: string;
  expires_at: string;
  is_verified: boolean;
  provider: string;
  verification_id?: string;
  metadata?: Record<string, any>;
}

export interface UserRecord {
  id: string;
  phone_number: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  metadata?: Record<string, any>;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  last_accessed_at: string;
  is_active: boolean;
  device_info?: Record<string, any>;
}

// API Request/Response types
export interface SendOTPAPIRequest {
  phoneNumber: string;
  isNewUser?: boolean;
}

export interface VerifyOTPAPIRequest {
  phoneNumber: string;
  otp: string;
  verificationId?: string;
}

export interface RefreshTokenAPIRequest {
  sessionToken: string;
}

export interface LogoutAPIRequest {
  sessionToken: string;
}

// Error types
export type AuthErrorCode = 
  | 'INVALID_PHONE_NUMBER'
  | 'OTP_SEND_FAILED'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'MAX_ATTEMPTS_EXCEEDED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'SESSION_EXPIRED'
  | 'INVALID_SESSION'
  | 'PROVIDER_ERROR'
  | 'DATABASE_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'UNKNOWN_ERROR';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: any;
}

// Configuration types
export interface OTPProviderConfig {
  firebase?: {
    projectId: string;
    privateKey: string;
    clientEmail: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
    serviceSid?: string;
  };
}

export interface SecurityConfig {
  jwtSecret: string;
  encryptionKey: string;
  hmacSecret: string;
  sessionTimeout: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

// Utility types
export type Provider = 'firebase' | 'twilio';
export type AuthProvider = Provider;

export interface ProviderInterface {
  sendOTP(phoneNumber: string): Promise<SendOTPResult>;
  verifyOTP(phoneNumber: string, otp: string, verificationId?: string): Promise<boolean>;
}
