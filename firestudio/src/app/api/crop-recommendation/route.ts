import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Crop Recommendation API Route
 * 
 * This route handles crop recommendation requests by forwarding them
 * to the unified Gemini API route for secure processing.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.location?.name) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 }
      );
    }
    
    if (!body.soilType) {
      return NextResponse.json(
        { error: 'Soil type is required' },
        { status: 400 }
      );
    }

    // Forward to unified Gemini API
    const geminiRequest = {
      type: 'crop-recommendation',
      location: body.location,
      soilType: body.soilType,
      language: body.language || 'english'
    };

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const geminiResponse = await fetch(`${baseUrl}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      return NextResponse.json(errorData, { status: geminiResponse.status });
    }

    const result = await geminiResponse.json();
    
    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error: any) {
    console.error('Crop recommendation API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get crop recommendations',
        message: error.message
      },
      { status: 500 }
    );
  }
}