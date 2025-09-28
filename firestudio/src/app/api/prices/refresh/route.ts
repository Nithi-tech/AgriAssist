// /src/app/api/prices/refresh/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { refreshDay, initPricesService } from '@/services/pricesService';
import { RefreshRequest } from '@/types/marketPrices';
import { getTodayISO } from '@/lib/date';

// Initialize service
let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    await initPricesService();
    isInitialized = true;
  }
}

/**
 * POST /api/prices/refresh - Trigger data refresh for specified date and states
 */
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    
    // Check admin authentication
    const adminKey = request.headers.get('X-ADMIN-KEY');
    const expectedKey = process.env.ADMIN_KEY;
    
    if (!expectedKey || adminKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    let body: RefreshRequest = {};
    
    try {
      const requestBody = await request.json();
      body = requestBody;
    } catch (error) {
      // If no body provided, use defaults
    }
    
    const {
      date = getTodayISO(),
      states = 'ALL',
      force = false
    } = body;
    
    console.log(`🔄 Refresh request received:`, {
      date,
      states: Array.isArray(states) ? states.join(', ') : states,
      force
    });
    
    // Start refresh (this is async but we return immediately)
    const refreshPromise = refreshDay(date, states);
    
    // Return 202 Accepted to indicate the refresh has started
    const response = {
      refresh_status: 'accepted' as const,
      message: 'Refresh started',
      date,
      states: Array.isArray(states) ? states : 'ALL' as const,
      timestamp: new Date().toISOString()
    };
    
    // Wait for the refresh to complete and return the result
    try {
      const refreshResult = await refreshPromise;
      
      return NextResponse.json({
        ...response,
        refresh_status: 'completed' as const,
        result: refreshResult
      });
      
    } catch (error: any) {
      console.error('❌ Refresh failed:', error);
      
      return NextResponse.json({
        ...response,
        refresh_status: 'failed' as const,
        error: error.message
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ Error in refresh API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start refresh',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/prices/refresh - Get refresh status
 */
export async function GET() {
  try {
    await ensureInitialized();
    
    // This could be enhanced to track ongoing refresh jobs
    // For now, return a simple status
    return NextResponse.json({
      refresh_status: 'ready',
      message: 'Refresh service is available',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error getting refresh status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get refresh status',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
