// /src/app/api/filters/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getFilters, initPricesService } from '@/services/pricesService';
import { FiltersPayload } from '@/types/marketPrices';

// Initialize service
let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    await initPricesService();
    isInitialized = true;
  }
}

/**
 * POST /api/filters - Get filter options based on current selection context
 */
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    
    let filtersPayload: Partial<FiltersPayload> = {};
    
    try {
      const body = await request.json();
      filtersPayload = body || {};
    } catch (error) {
      // If no body provided, return all available filters
    }
    
    console.log(`🔍 Filters request:`, filtersPayload);
    
    const filters = await getFilters(filtersPayload);
    
    return NextResponse.json({
      success: true,
      filters,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error getting filters:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get filters',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/filters - Get all available filter options (no context)
 */
export async function GET() {
  try {
    await ensureInitialized();
    
    console.log(`🔍 Getting all available filters`);
    
    const filters = await getFilters({});
    
    return NextResponse.json({
      success: true,
      filters,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error getting all filters:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get filters',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
