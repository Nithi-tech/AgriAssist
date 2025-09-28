// ============================================================================
// MARKET PRICES DEMO API - Works without Supabase setup
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import type { MarketPrice } from '@/types/market-prices';

// Demo market prices data
const DEMO_MARKET_PRICES: MarketPrice[] = [
  {
    id: '1',
    state: 'Karnataka',
    district: 'Bangalore',
    market: 'KR Market',
    commodity: 'Rice',
    variety: 'BPT 5204',
    unit: 'Quintal',
    min_price: 2800,
    max_price: 3200,
    modal_price: 3000,
    date: new Date().toISOString().split('T')[0],
    source: 'api',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    state: 'Maharashtra',
    district: 'Pune',
    market: 'Gultekdi Market',
    commodity: 'Onion',
    variety: 'Red',
    unit: 'Quintal',
    min_price: 1500,
    max_price: 2000,
    modal_price: 1750,
    date: new Date().toISOString().split('T')[0],
    source: 'scraper',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    state: 'Tamil Nadu',
    district: 'Chennai',
    market: 'Koyambedu Market',
    commodity: 'Tomato',
    variety: 'Local',
    unit: 'Quintal',
    min_price: 800,
    max_price: 1200,
    modal_price: 1000,
    date: new Date().toISOString().split('T')[0],
    source: 'api',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    state: 'Punjab',
    district: 'Ludhiana',
    market: 'Grain Market',
    commodity: 'Wheat',
    variety: 'HD 2967',
    unit: 'Quintal',
    min_price: 2200,
    max_price: 2400,
    modal_price: 2300,
    date: new Date().toISOString().split('T')[0],
    source: 'api',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    state: 'Haryana',
    district: 'Karnal',
    market: 'APMC Market',
    commodity: 'Basmati Rice',
    variety: 'Pusa Basmati 1',
    unit: 'Quintal',
    min_price: 4200,
    max_price: 4800,
    modal_price: 4500,
    date: new Date().toISOString().split('T')[0],
    source: 'api',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// ============================================================================
// GET DEMO MARKET PRICES WITH FILTERS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const state = searchParams.get('state');
    const commodity = searchParams.get('commodity');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    console.log('📊 [DEMO] Fetching market prices with filters:', {
      state, commodity, search, page, limit
    });
    
    // Filter demo data
    let filteredData = DEMO_MARKET_PRICES;
    
    if (state) {
      filteredData = filteredData.filter(item => 
        item.state.toLowerCase().includes(state.toLowerCase())
      );
    }
    
    if (commodity) {
      filteredData = filteredData.filter(item => 
        item.commodity.toLowerCase().includes(commodity.toLowerCase())
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.commodity.toLowerCase().includes(searchLower) ||
        item.market.toLowerCase().includes(searchLower) ||
        item.state.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedData = filteredData.slice(startIndex, startIndex + limit);
    
    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: filteredData.length,
        totalPages: Math.ceil(filteredData.length / limit)
      },
      filters: { state, commodity, search },
      message: '🎯 Demo data - Set up Supabase for real data'
    });
    
  } catch (error: any) {
    console.error('❌ Demo API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Demo API error',
      error: error?.message || String(error)
    }, { status: 500 });
  }
}

// ============================================================================
// POST DEMO STATISTICS AND ACTIONS
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    
    if (action === 'stats') {
      console.log('📈 [DEMO] Fetching market price statistics');
      
      return NextResponse.json({
        success: true,
        stats: {
          totalRecords: DEMO_MARKET_PRICES.length,
          statesCount: new Set(DEMO_MARKET_PRICES.map(p => p.state)).size,
          commoditiesCount: new Set(DEMO_MARKET_PRICES.map(p => p.commodity)).size,
          lastUpdated: new Date().toISOString()
        },
        message: '📊 Demo statistics - Set up Supabase for real data'
      });
    }
    
    if (action === 'states') {
      console.log('🗺️ [DEMO] Fetching unique states');
      
      const states = [...new Set(DEMO_MARKET_PRICES.map(p => p.state))].sort();
      
      return NextResponse.json({
        success: true,
        states,
        message: '🌍 Demo states data'
      });
    }
    
    if (action === 'commodities') {
      console.log('🌾 [DEMO] Fetching unique commodities');
      
      const commodities = [...new Set(DEMO_MARKET_PRICES.map(p => p.commodity))].sort();
      
      return NextResponse.json({
        success: true,
        commodities,
        message: '🌾 Demo commodities data'
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action specified'
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('❌ Demo POST API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Demo POST API error',
      error: error?.message || String(error)
    }, { status: 500 });
  }
}
