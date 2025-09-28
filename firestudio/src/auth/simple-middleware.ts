/**
 * Simple Authentication Middleware for Build Time
 * Basic validation and security functions without complex dependencies
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limiting storage (in-memory for simplicity)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Validate mobile number format
 */
export function validateMobileNumber(mobile_number: string): { valid: boolean; message?: string } {
  if (!mobile_number) {
    return { valid: false, message: 'Mobile number is required' };
  }

  // Remove all non-digit characters for validation
  const cleanedNumber = mobile_number.replace(/\D/g, '');
  
  // Indian mobile number validation (10 digits, starting with 6-9)
  if (!/^[6-9]\d{9}$/.test(cleanedNumber)) {
    return { 
      valid: false, 
      message: 'Invalid Indian mobile number format. Must be 10 digits starting with 6-9.' 
    };
  }

  return { valid: true };
}

/**
 * Validate OTP format
 */
export function validateOTP(otp: string): { valid: boolean; message?: string } {
  if (!otp) {
    return { valid: false, message: 'OTP is required' };
  }

  if (!/^\d{6}$/.test(otp)) {
    return { valid: false, message: 'OTP must be 6 digits' };
  }

  return { valid: true };
}

/**
 * Simple rate limiting
 */
export function rateLimit(clientIP: string, action: string, options?: {
  windowMs?: number;
  maxRequests?: number;
}): boolean {
  const { windowMs = 60000, maxRequests = 5 } = options || {};
  const key = `${clientIP}:${action}`;
  const now = Date.now();
  
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    // First request or window has expired
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return false;
  }
  
  // Increment count
  entry.count++;
  return true;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  return response;
}
