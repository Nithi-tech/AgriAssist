/**
 * User Profile API Route
 * GET /api/auth/profile - Get current user profile
 * PUT /api/auth/profile - Update user profile
 * 
 * Protected route requiring authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '../../../../auth/auth-service';
import { authenticateToken, validateName, addSecurityHeaders } from '../../../../auth/middleware';

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResponse = await authenticateToken(request);
    if (authResponse) {
      return authResponse; // Return error response
    }

    // Get user from request context (set by middleware)
    const user = (request as any).user;
    if (!user) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        )
      );
    }

    // Get full user details
    const authService = AuthService.getInstance();
    const fullUser = await authService.getUserById(user.id);

    if (!fullUser) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        )
      );
    }

    const response = {
      success: true,
      data: {
        user: {
          id: fullUser.id,
          name: fullUser.name,
          mobile_number: fullUser.mobile_number,
          location: fullUser.location,
          is_verified: fullUser.is_verified,
          last_login: fullUser.last_login,
          created_at: fullUser.created_at
        }
      }
    };

    return addSecurityHeaders(
      NextResponse.json(response, { status: 200 })
    );

  } catch (error) {
    console.error('Get profile error:', error);
    
    return addSecurityHeaders(
      NextResponse.json(
        { success: false, message: 'Failed to get profile' },
        { status: 500 }
      )
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const authResponse = await authenticateToken(request);
    if (authResponse) {
      return authResponse; // Return error response
    }

    // Get user from request context
    const user = (request as any).user;
    if (!user) {
      return addSecurityHeaders(
        NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        )
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, location } = body;

    // Validate name if provided
    if (name) {
      const nameValidation = validateName(name);
      if (!nameValidation.valid) {
        return addSecurityHeaders(
          NextResponse.json(
            { success: false, message: nameValidation.message },
            { status: 400 }
          )
        );
      }
    }

    // Validate location if provided
    let validatedLocation = null;
    if (location) {
      if (typeof location === 'object' && location !== null) {
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

    // Update user in database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_KEY || 'placeholder-key'
    );

    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (name) {
      updateData.name = name.trim();
    }
    
    if (validatedLocation) {
      updateData.location = validatedLocation;
    }

    const { data, error } = await supabase
      .from('auth_users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const response = {
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: data.id,
          name: data.name,
          mobile_number: data.mobile_number,
          location: data.location,
          is_verified: data.is_verified,
          last_login: data.last_login,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
      }
    };

    return addSecurityHeaders(
      NextResponse.json(response, { status: 200 })
    );

  } catch (error) {
    console.error('Update profile error:', error);
    
    return addSecurityHeaders(
      NextResponse.json(
        { success: false, message: 'Failed to update profile' },
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
