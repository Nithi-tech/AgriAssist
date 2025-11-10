import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Disease Diagnosis Test API Route
 * 
 * This route handles disease diagnosis requests by forwarding them
 * to the unified Gemini API route for secure processing.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageDataUri } = body;

    if (!imageDataUri) {
      return NextResponse.json(
        { error: 'Image data URI is required' },
        { status: 400 }
      );
    }

    console.log('Testing disease diagnosis with image data URI');
    
    // Forward to unified Gemini API
    const geminiRequest = {
      type: 'disease-diagnosis',
      imageDataUri: imageDataUri,
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

  } catch (error) {
    console.error('Disease diagnosis test error:', error);
    
    return NextResponse.json(
      { 
        error: 'Disease diagnosis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
