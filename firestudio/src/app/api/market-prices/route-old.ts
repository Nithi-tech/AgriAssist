// ============================================================================
// MARKET PRICES API ROUTE - GET market prices with filters and pagination
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { MarketPrice, MarketPriceFilters } from '@/types/market-prices';
import { 
  getMarketPrices, 
  getMarketPriceStats, 
  type MarketPriceFilter, 
  type MarketPriceStats 
} from '@/lib/marketPricesApi';

// Generic API Response type
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// GET MARKET PRICES WITH FILTERS
// ============================================================================
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<MarketPrice[] | MarketPriceStats>>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if requesting stats
    const requestType = searchParams.get('type');
    
    if (requestType === 'stats') {
      console.log('📊 Fetching market price statistics');
      const stats = await getMarketPriceStats();
      
      return NextResponse.json({
        success: true,
        message: 'Market price statistics retrieved successfully',
        data: stats
      });
    }

    // Parse query parameters for filtering
    const filters: MarketPriceFilter = {
      state: searchParams.get('state') || undefined,
      commodity: searchParams.get('commodity') || undefined,
      district: searchParams.get('district') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof MarketPriceFilter] === undefined) {
        delete filters[key as keyof MarketPriceFilter];
      }
    });

    console.log('🔍 Fetching market prices with filters:', filters);

    // Fetch market prices
    const marketPricesData = await getMarketPrices(filters);
    
    // Transform the data to match the expected MarketPrice type from types file
    const marketPrices: MarketPrice[] = marketPricesData.map(price => ({
      ...price,
      id: price.id || '',
      source: 'api' as const,
      created_at: price.created_at || new Date().toISOString(),
      updated_at: price.updated_at || new Date().toISOString()
    }));

    // Calculate pagination metadata
    const page = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;
    const hasMore = marketPrices.length === (filters.limit || 50);

    const response: ApiResponse<MarketPrice[]> = {
      success: true,
      message: `Retrieved ${marketPrices.length} market price records`,
      data: marketPrices,
      meta: {
        total: marketPrices.length,
        page,
        limit: filters.limit || 50,
        hasMore
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching market prices:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch market prices',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ============================================================================
// SEARCH MARKET PRICES (POST for complex queries)
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<MarketPrice[]>>> {
  try {
    const body = await request.json();
    
    const filters: MarketPriceFilter = {
      state: body.state,
      commodity: body.commodity,
      district: body.district,
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
      limit: body.limit || 50,
      offset: body.offset || 0,
    };

    console.log('🔍 Searching market prices with filters:', filters);

    const marketPricesData = await getMarketPrices(filters);
    
    // Transform the data to match the expected MarketPrice type from types file
    const marketPrices: MarketPrice[] = marketPricesData.map(price => ({
      ...price,
      id: price.id || '',
      source: 'api' as const,
      created_at: price.created_at || new Date().toISOString(),
      updated_at: price.updated_at || new Date().toISOString()
    }));

    const response: ApiResponse<MarketPrice[]> = {
      success: true,
      message: `Found ${marketPrices.length} market price records`,
      data: marketPrices,
      meta: {
        total: marketPrices.length,
        page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
        limit: filters.limit || 50,
        hasMore: marketPrices.length === (filters.limit || 50)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error searching market prices:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to search market prices',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
