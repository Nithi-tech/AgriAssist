import { NextRequest, NextResponse } from 'next/server';
import { diagnoseLeafDisease } from '@/ai/flows/disease-diagnosis';

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
    
    const result = await diagnoseLeafDisease({ 
      leafImageDataUri: imageDataUri 
    });

    return NextResponse.json({
      success: true,
      data: result
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
