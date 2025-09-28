/**
 * Logout API Route
 * POST /api/auth/logout
 * 
 * Handles user logout by invalidating session
 */

import { NextRequest, NextResponse } from 'next/server';
import { addSecurityHeaders } from '@/auth/simple-middleware';

export async function POST(request: NextRequest) {
  try {
    // Clear auth token cookie
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Logout successful' 
      },
      { status: 200 }
    );

    // Remove the auth token cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return addSecurityHeaders(response);

  } catch (error) {
    console.error('Logout error:', error);
    
    return addSecurityHeaders(
      NextResponse.json(
        { 
          success: false, 
          message: 'Logout failed' 
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
