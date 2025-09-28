import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from 'express-rate-limit';

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

// Simple in-memory rate limiting for API routes
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function createRateLimit(options: { windowMs: number; max: number }) {
  return (identifier: string): boolean => {
    const now = Date.now();
    const record = requestCounts.get(identifier);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return false; // Not rate limited
    }

    if (record.count >= options.max) {
      return true; // Rate limited
    }

    // Increment count
    record.count++;
    return false; // Not rate limited
  };
}

// Rate limiter for OTP requests
export const otpRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3 // Max 3 OTP requests per 15 minutes per IP
});

// Rate limiter for verification requests
export const verifyRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10 // Max 10 verification attempts per 5 minutes per IP
});

/**
 * Middleware to validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Indian phone number validation (10 digits, starting with 6-9)
  const phoneRegex = /^[6-9]\d{9}$/;
  const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
  
  // Remove country code if present
  const normalizedPhone = cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone;
  
  return phoneRegex.test(normalizedPhone);
}

/**
 * Normalize phone number to standard format
 */
export function normalizePhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
  const normalizedPhone = cleanPhone.startsWith('91') ? cleanPhone.slice(2) : cleanPhone;
  return `+91${normalizedPhone}`;
}

/**
 * Extract IP address from request
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Validate request body for required fields
 */
export function validateRequestBody(body: any, requiredFields: string[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!body) {
    errors.push('Request body is required');
    return { isValid: false, errors };
  }
  
  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .slice(0, 1000); // Limit length
}

/**
 * API Response helper
 */
export class ApiResponse {
  static success(data: any, message?: string) {
    return NextResponse.json({
      success: true,
      message: message || 'Operation successful',
      data
    });
  }
  
  static error(message: string, statusCode: number = 400, details?: any) {
    return NextResponse.json({
      success: false,
      message,
      details
    }, { status: statusCode });
  }
  
  static validationError(errors: string[]) {
    return NextResponse.json({
      success: false,
      message: 'Validation failed',
      errors
    }, { status: 400 });
  }
  
  static rateLimitError() {
    return NextResponse.json({
      success: false,
      message: 'Too many requests. Please try again later.'
    }, { status: 429 });
  }
}

/**
 * Middleware to handle common request processing
 */
export async function withMiddleware(
  req: NextRequest,
  handler: (req: NextRequest, context: { clientIP: string }) => Promise<NextResponse>
) {
  try {
    const clientIP = getClientIP(req);
    
    // Add CORS headers
    const response = await handler(req, { clientIP });
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return ApiResponse.error('Internal server error', 500);
  }
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
