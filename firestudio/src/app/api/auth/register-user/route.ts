/**
 * Register User API Route
 * POST /api/auth/register-user
 * 
 * Completes user registration after OTP verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../../../auth/auth-service';
import { validateMobileNumber, validateName, rateLimit, addSecurityHeaders } from '../../../../auth/middleware';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 registration attempts per 15 minutes per IP
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
    const { mobile_number, name, location } = body;

    // Validate required input
    if (!mobile_number || !name) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: 'Mobile number and name are required' 
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

    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: nameValidation.message 
          },
          { status: 400 }
        )
      );
    }

    // Clean inputs
    const cleanedMobile = mobile_number.replace(/\D/g, '');
    const trimmedName = name.trim();

    // Check if user already exists
    const authService = AuthService.getInstance();
    const { exists } = await authService.checkMobileExists(cleanedMobile);

    if (exists) {
      return addSecurityHeaders(
        NextResponse.json(
          { 
            success: false, 
            message: 'User already exists. Please login instead.' 
          },
          { status: 400 }
        )
      );
    }

    // Validate location if provided
    let validatedLocation = null;
    if (location) {
      if (typeof location === 'object' && location !== null) {
        // Basic location validation
        const { address, city, state, country, lat, lng } = location;
        
        if (address && city && state && country) {
          validatedLocation = {
            address: address.toString().trim(),
            city: city.toString().trim(),
            state: state.toString().trim(),
            country: country.toString().trim(),
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null
          };
        }
      }
    }

    // Register user
    const result = await authService.registerUser({
      mobile_number: cleanedMobile,
      name: trimmedName,
      location: validatedLocation
    });

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

    // Build response
    const response = {
      success: true,
      message: result.message,
      data: {
        user: {
          id: result.data?.user.id,
          name: result.data?.user.name,
          mobile_number: result.data?.user.mobile_number,
          location: result.data?.user.location,
          is_verified: result.data?.user.is_verified,
          created_at: result.data?.user.created_at
        }
      },
      token: result.token
    };

    // Set secure HTTP-only cookie for token
    let nextResponse = NextResponse.json(response, { status: 201 });
    
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
    console.error('Register user error:', error);
    
    return addSecurityHeaders(
      NextResponse.json(
        { 
          success: false, 
          message: 'Registration failed. Please try again.' 
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
