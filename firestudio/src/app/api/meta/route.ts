// /src/app/api/meta/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { testSystemHealth, initPricesService } from '@/services/pricesService';

// Initialize service
let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    await initPricesService();
    isInitialized = true;
  }
}

/**
 * GET /api/meta - Get system metadata and health information
 */
export async function GET() {
  try {
    await ensureInitialized();
    
    console.log(`📊 Getting system metadata`);
    
    const health = await testSystemHealth();
    
    return NextResponse.json({
      success: true,
      meta: health,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error getting system metadata:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get system metadata',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
