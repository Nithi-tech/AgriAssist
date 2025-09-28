// ============================================================================
// MARKET PRICES API ROUTE - GET market prices with filters and pagination
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

// Import mock data
import mockMarketPrices from '@/data/mock/market_prices.json';

// In-memory storage for market prices
let marketPricesData = [...mockMarketPrices];

// Types
interface MarketPrice {
  id: number;
  commodity: string;
  market: string;
  state: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  date: string;
  created_at: string;
}

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
// GET MARKET PRICES WITH FILTERS
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<MarketPrice[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const commodity = searchParams.get('commodity');
    const state = searchParams.get('state');
    const market = searchParams.get('market');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    console.log('🔍 Market prices request:', {
      commodity, state, market, dateFrom, dateTo, page, limit
    });

    // Filter data based on query parameters
    let filteredData = [...marketPricesData];

    if (commodity) {
      filteredData = filteredData.filter(price => 
        price.commodity.toLowerCase().includes(commodity.toLowerCase())
      );
    }

    if (state) {
      filteredData = filteredData.filter(price => 
        price.state.toLowerCase().includes(state.toLowerCase())
      );
    }

    if (market) {
      filteredData = filteredData.filter(price => 
        price.market.toLowerCase().includes(market.toLowerCase())
      );
    }

    if (dateFrom) {
      filteredData = filteredData.filter(price => 
        new Date(price.date) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filteredData = filteredData.filter(price => 
        new Date(price.date) <= new Date(dateTo)
      );
    }

    // Sort by date (newest first)
    filteredData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pagination
    const total = filteredData.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log(`✅ Returning ${paginatedData.length} market prices (page ${page})`);

    return NextResponse.json({
      success: true,
      message: 'Market prices fetched successfully',
      data: paginatedData,
      meta: {
        total,
        page,
        limit,
        hasMore
      }
    });

  } catch (error: any) {
    console.error('❌ Error in GET /api/market-prices:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch market prices',
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// ============================================================================
// POST - Add new market price
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<MarketPrice>>> {
  try {
    const body = await request.json();
    console.log('📊 Adding new market price:', body);

    // Validation
    const requiredFields = ['commodity', 'market', 'state', 'min_price', 'max_price', 'modal_price'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // Create new market price
    const newPrice: MarketPrice = {
      id: Math.max(...marketPricesData.map(p => p.id), 0) + 1,
      commodity: body.commodity,
      market: body.market,
      state: body.state,
      min_price: parseFloat(body.min_price),
      max_price: parseFloat(body.max_price),
      modal_price: parseFloat(body.modal_price),
      date: body.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    marketPricesData.push(newPrice);

    return NextResponse.json({
      success: true,
      message: 'Market price added successfully',
      data: newPrice
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error in POST /api/market-prices:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to add market price',
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
