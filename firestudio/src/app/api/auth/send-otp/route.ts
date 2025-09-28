import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/auth/simple-auth-service';
import { 
  validateMobileNumber, 
  rateLimit, 
  addSecurityHeaders 
} from '@/auth/simple-middleware';

const authService = AuthService.getInstance();

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';

    // Check rate limiting
    if (!rateLimit(clientIP, 'otp-send', { maxRequests: 3, windowMs: 60000 })) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: 'Too many OTP requests. Please try again later.',
            error: 'RATE_LIMITED'
          },
          { status: 429 }
        )
      );
    }

    // Parse request body
    const body = await request.json();
    const { mobile_number, purpose = 'login' } = body;

    // Validate required fields
    if (!mobile_number) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: 'Mobile number is required',
            error: 'MISSING_MOBILE'
          },
          { status: 400 }
        )
      );
    }

    // Validate mobile number format
    const validation = validateMobileNumber(mobile_number);
    if (!validation.valid) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: validation.message,
            error: 'INVALID_MOBILE'
          },
          { status: 400 }
        )
      );
    }

    // Validate purpose
    if (!['login', 'signup', 'reset'].includes(purpose)) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: 'Invalid purpose. Must be login, signup, or reset',
            error: 'INVALID_PURPOSE'
          },
          { status: 400 }
        )
      );
    }

    // Clean mobile number (remove non-digits)
    const cleanedMobile = mobile_number.replace(/\D/g, '');

    // Check if user exists for login/reset purposes
    const exists = await authService.checkUserExists(cleanedMobile);

    if (purpose === 'login' && !exists) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: 'User not found. Please sign up first.',
            error: 'USER_NOT_FOUND',
            shouldRedirect: '/auth/signup'
          },
          { status: 404 }
        )
      );
    }

    if (purpose === 'signup' && exists) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: 'User already exists. Please login instead.',
            error: 'USER_EXISTS',
            shouldRedirect: '/auth/login'
          },
          { status: 409 }
        )
      );
    }

    // Send OTP
    const result = await authService.sendOTP(cleanedMobile, purpose);

    if (result.success) {
      return addSecurityHeaders(
        NextResponse.json(
          {
            success: true,
            message: 'OTP sent successfully',
            data: {
              mobile_number: cleanedMobile,
              otp_sent: true,
              expires_in: 300, // 5 minutes
              purpose,
              session_id: result.session_id
            }
          },
          { status: 200 }
        )
      );
    } else {
      return addSecurityHeaders(
        NextResponse.json(
          {
            success: false,
            message: result.message || 'Failed to send OTP',
            error: result.error || 'OTP_SEND_FAILED'
          },
          { status: 500 }
        )
      );
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    
    return addSecurityHeaders(
      NextResponse.json(
        {
          success: false,
          message: 'Internal server error',
          error: 'INTERNAL_ERROR'
        },
        { status: 500 }
      )
    );
  }
}
