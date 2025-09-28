/**
 * Verify OTP API Route
 * POST /api/auth/verify-otp
 * 
 * Verifies OTP and handles login/signup flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/auth/simple-auth-service';
import { validateMobileNumber, validateOTP, rateLimit, addSecurityHeaders } from '@/auth/simple-middleware';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';

    // Apply rate limiting for OTP verification (10 attempts per 15 minutes)
    if (!rateLimit(clientIP, 'otp-verify', { maxRequests: 10, windowMs: 15 * 60 * 1000 })) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: 'Too many verification attempts. Please try again later.',
            error: 'RATE_LIMITED'
          },
          { status: 429 }
        )
      );
    }

    // Parse request body
    const body = await request.json();
    const { mobile_number, otp } = body;

    // Validate input
    if (!mobile_number || !otp) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: 'Mobile number and OTP are required' 
          },
          { status: 400 }
        )
      );
    }

    // Validate mobile number format
    const mobileValidation = validateMobileNumber(mobile_number);
    if (!mobileValidation.valid) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: mobileValidation.message 
          },
          { status: 400 }
        )
      );
    }

    // Validate OTP format
    const otpValidation = validateOTP(otp);
    if (!otpValidation.valid) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: otpValidation.message 
          },
          { status: 400 }
        )
      );
    }

    // Clean inputs
    const cleanedMobile = mobile_number.replace(/\D/g, '');
    const cleanedOtp = otp.replace(/\D/g, '');

    // Verify OTP
    const authService = AuthService.getInstance();
    const result = await authService.verifyOTP(cleanedMobile, cleanedOtp);

    if (!result.success) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: result.message 
          },
          { status: 400 }
        )
      );
    }

    // Build response based on user status
    const response: any = {
      success: true,
      message: result.message,
      data: {
        mobile_number: cleanedMobile,
        is_new_user: result.data?.isNewUser || false
      }
    };

    // Add token and user info for existing users
    if (result.token && result.data?.user) {
      response.data.user = {
        id: result.data.user.id,
        name: result.data.user.name,
        mobile_number: result.data.user.mobile_number,
        location: result.data.user.location,
        is_verified: result.data.user.is_verified,
        last_login: result.data.user.last_login
      };
      response.token = result.token;
    }

    // Set secure HTTP-only cookie for token if available
    let nextResponse = NextResponse.json(response, { status: 200 });
    
    if (result.token) {
      nextResponse.cookies.set('auth_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });
    }

    return addSecurityHeaders(nextResponse);

  } catch (error) {
    console.error('Verify OTP error:', error);
    
    return addSecurityHeaders(
      NextResponse.json(
        { 
          success: false, 
          message: 'OTP verification failed. Please try again.' 
        },
        { status: 500 }
      )
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addSecurityHeaders(response);
}
