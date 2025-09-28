/**
 * Authentication Middleware
 * Handles JWT token validation and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth-service';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    mobile_number: string;
    name?: string;
  };
}

/**
 * JWT Authentication Middleware
 */
export async function authenticateToken(request: NextRequest): Promise<NextResponse | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    const authService = AuthService.getInstance();
    const verification = await authService.verifyToken(token);

    if (!verification.valid || !verification.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 403 }
      );
    }

    // Get user details
    const user = await authService.getUserById(verification.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Add user to request context
    (request as AuthenticatedRequest).user = {
      id: user.id,
      mobile_number: user.mobile_number,
      name: user.name
    };

    return null; // Continue to handler
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Rate Limiting Middleware
 */
export async function rateLimit(
  request: NextRequest,
  options: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: NextRequest) => string;
  }
): Promise<NextResponse | null> {
  try {
    const key = options.keyGenerator 
      ? options.keyGenerator(request)
      : getClientIP(request);

    // In production, you would use Redis or similar for distributed rate limiting
    // For now, we'll use a simple in-memory store
    const rateLimitStore = getRateLimitStore();
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean old entries
    for (const [storeKey, data] of rateLimitStore.entries()) {
      if (data.windowStart < windowStart) {
        rateLimitStore.delete(storeKey);
      }
    }

    // Check current requests
    const currentData = rateLimitStore.get(key);
    
    if (!currentData) {
      rateLimitStore.set(key, {
        count: 1,
        windowStart: now
      });
      return null; // Allow request
    }

    if (currentData.windowStart < windowStart) {
      // Reset window
      rateLimitStore.set(key, {
        count: 1,
        windowStart: now
      });
      return null; // Allow request
    }

    if (currentData.count >= options.maxRequests) {
      const remainingTime = Math.ceil((currentData.windowStart + options.windowMs - now) / 1000);
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${remainingTime} seconds.`,
          retryAfter: remainingTime
        },
        { 
          status: 429,
          headers: {
            'Retry-After': remainingTime.toString(),
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil((currentData.windowStart + options.windowMs) / 1000).toString()
          }
        }
      );
    }

    // Increment count
    currentData.count++;
    rateLimitStore.set(key, currentData);

    return null; // Allow request
  } catch (error) {
    console.error('Rate limit error:', error);
    return null; // Allow request on error
  }
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  return 'unknown';
}

/**
 * Simple in-memory rate limit store
 * In production, use Redis or similar distributed cache
 */
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function getRateLimitStore() {
  return rateLimitStore;
}

/**
 * Validation Middleware
 */
export function validateMobileNumber(mobileNumber: string): { valid: boolean; message?: string } {
  // Remove all non-digit characters
  const cleaned = mobileNumber.replace(/\D/g, '');
  
  // Check length (10 digits for most countries, adjust as needed)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return {
      valid: false,
      message: 'Mobile number must be 10-15 digits long'
    };
  }

  // Basic format validation (starts with digit, no special patterns)
  if (!/^[1-9]\d{9,14}$/.test(cleaned)) {
    return {
      valid: false,
      message: 'Invalid mobile number format'
    };
  }

  return { valid: true };
}

export function validateOTP(otp: string): { valid: boolean; message?: string } {
  const cleaned = otp.replace(/\D/g, '');
  const expectedLength = parseInt(process.env.OTP_LENGTH || '6');
  
  if (cleaned.length !== expectedLength) {
    return {
      valid: false,
      message: `OTP must be ${expectedLength} digits long`
    };
  }

  return { valid: true };
}

export function validateName(name: string): { valid: boolean; message?: string } {
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return {
      valid: false,
      message: 'Name must be at least 2 characters long'
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      message: 'Name must be less than 100 characters long'
    };
  }

  // Allow letters, spaces, apostrophes, hyphens
  if (!/^[a-zA-Z\s'\-]+$/.test(trimmed)) {
    return {
      valid: false,
      message: 'Name can only contain letters, spaces, apostrophes, and hyphens'
    };
  }

  return { valid: true };
}

/**
 * Security Headers Middleware
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add CORS headers if needed
  if (process.env.CORS_ORIGIN) {
    response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGIN);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}
