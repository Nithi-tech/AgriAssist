import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Weather Bot API Route
 * 
 * This route handles weather chat requests by forwarding them
 * to the unified Gemini API route for secure processing.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Forward to unified Gemini API
    const geminiRequest = {
      type: 'weather-chat',
      query: body.query,
      weatherData: body.weatherData,
      language: body.language || 'en'
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
    console.error('Weather bot API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get weather bot response',
        message: error.message
      },
      { status: 500 }
    );
  }
}