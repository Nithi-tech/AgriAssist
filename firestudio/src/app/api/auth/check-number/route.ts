/**
 * Check Mobile Number API Route
 * POST /api/auth/check-number
 * 
 * Checks if a mobile number exists in the system
 * Returns user status for login/signup flow routing
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/auth/simple-auth-service';
import { validateMobileNumber, rateLimit, addSecurityHeaders } from '@/auth/middleware';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // 10 requests per 15 minutes
      keyGenerator: (req: NextRequest) => {
        const forwarded = req.headers.get('x-forwarded-for');
        return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
      }
    });

    if (rateLimitResponse) {
      return addSecurityHeaders(rateLimitResponse);
    }

    // Parse request body
    const body = await request.json();
    const { mobile_number } = body;

    // Validate input
    if (!mobile_number) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: 'Mobile number is required' 
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
            message: validation.message 
          },
          { status: 400 }
        )
      );
    }

    // Clean mobile number
    const cleanedMobile = mobile_number.replace(/\D/g, '');

    // Check if mobile exists
    const authService = AuthService.getInstance();
    const { exists, user } = await authService.checkMobileExists(cleanedMobile);

    const response = {
      success: true,
      data: {
        exists,
        mobile_number: cleanedMobile,
        user_info: exists && user ? {
          id: user.id,
          name: user.name,
          last_login: user.last_login || null,
          is_verified: user.is_verified || false
        } : null,
        next_step: exists ? 'login' : 'signup'
      }
    };

    return addSecurityHeaders(
      NextResponse.json(response, { status: 200 })
    );

  } catch (error) {
    console.error('Check mobile number error:', error);
    
    return addSecurityHeaders(
      NextResponse.json(
        { 
          success: false, 
          message: 'Internal server error' 
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
