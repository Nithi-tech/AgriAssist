// ============================================================================
// MARKET PRICES API ROUTE - GET market prices with filters and pagination
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { MarketPrice, MarketPriceFilters } from '@/types/market-prices';

// ============================================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// GET MARKET PRICES WITH FILTERS
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const state = searchParams.get('state');
    const commodity = searchParams.get('commodity');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    console.log('📊 Fetching market prices with filters:', {
      state, commodity, dateFrom, dateTo, search, page, limit
    });
    
    // Build query
    let query = supabase
      .from('market_prices')
      .select('*');
    
    // Apply filters
    if (state) {
      query = query.eq('state', state);
    }
    
    if (commodity) {
      query = query.ilike('commodity', `%${commodity}%`);
    }
    
    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('date', dateTo);
    }
    
    if (search) {
      query = query.or(`commodity.ilike.%${search}%,market.ilike.%${search}%,state.ilike.%${search}%`);
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Error fetching market prices:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch market prices',
        error: error.message
      }, { status: 500 });
    }
    
    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('market_prices')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      },
      filters: {
        state,
        commodity,
        dateFrom,
        dateTo,
        search
      }
    });
    
  } catch (error: any) {
    console.error('❌ Market prices API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error?.message || String(error)
    }, { status: 500 });
  }
}

// ============================================================================
// GET MARKET PRICE STATISTICS
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    
    if (action === 'stats') {
      console.log('📈 Fetching market price statistics');
      
      // Get basic statistics
      const { count: totalRecords } = await supabase
        .from('market_prices')
        .select('*', { count: 'exact', head: true });
      
      const { data: states } = await supabase
        .from('market_prices')
        .select('state', { count: 'exact' })
        .order('state');
      
      const { data: commodities } = await supabase
        .from('market_prices')
        .select('commodity', { count: 'exact' })
        .order('commodity');
      
      const { data: latestPrice } = await supabase
        .from('market_prices')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      return NextResponse.json({
        success: true,
        stats: {
          totalRecords: totalRecords || 0,
          statesCount: states?.length || 0,
          commoditiesCount: commodities?.length || 0,
          lastUpdated: latestPrice?.[0]?.updated_at || new Date().toISOString()
        }
      });
    }
    
    if (action === 'states') {
      console.log('🗺️ Fetching unique states');
      
      const { data, error } = await supabase
        .from('market_prices')
        .select('state', { count: 'exact' })
        .order('state');
      
      if (error) throw error;
      
      return NextResponse.json({
        success: true,
        states: data?.map(item => item.state) || []
      });
    }
    
    if (action === 'commodities') {
      console.log('🌾 Fetching unique commodities');
      
      const { data, error } = await supabase
        .from('market_prices')
        .select('commodity', { count: 'exact' })
        .order('commodity');
      
      if (error) throw error;
      
      return NextResponse.json({
        success: true,
        commodities: data?.map(item => item.commodity) || []
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action specified'
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('❌ Market prices POST API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error?.message || String(error)
    }, { status: 500 });
  }
}
