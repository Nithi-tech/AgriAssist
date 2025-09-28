import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Market data utilities - moved inline to fix import issues
const DATA_FILE_PATH = path.join(process.cwd(), 'backend', 'data', 'marketPrices.json');

// Check if two dates are in the same week (Sunday to Saturday)
function isSameWeek(date1: Date, date2: Date): boolean {
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday is 0
    return new Date(d.setDate(diff));
  };
  
  const week1 = getWeekStart(date1);
  const week2 = getWeekStart(date2);
  
  return week1.getTime() === week2.getTime();
}

// Read existing market data from JSON file
async function readMarketData() {
  try {
    // Ensure directory exists
    const dataDir = path.dirname(DATA_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('📂 No existing market data file, will create new one');
    return null;
  }
}

// Write market data to JSON file
async function writeMarketData(data: any) {
  try {
    // Ensure directory exists
    const dataDir = path.dirname(DATA_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    console.log(`💾 Market data saved to ${DATA_FILE_PATH}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving market data:', error);
    throw error;
  }
}

// Fetch fresh market data from API
async function fetchFreshMarketData() {
  console.log('🌐 Fetching fresh market data from API...');
  
  try {
    // Mock data for testing - replace with actual API call
    const mockData = {
      prices: [
        {
          id: 1,
          state: "Maharashtra",
          district: "Pune",
          market: "Pune Market",
          commodity: "Rice",
          variety: "Basmati",
          grade: "FAQ",
          minPrice: 2500,
          maxPrice: 3000,
          modalPrice: 2750,
          unit: "Quintal",
          date: new Date().toISOString().split('T')[0]
        },
        {
          id: 2,
          state: "Punjab",
          district: "Ludhiana",
          market: "Ludhiana Mandi",
          commodity: "Wheat",
          variety: "PBW 343",
          grade: "FAQ",
          minPrice: 2000,
          maxPrice: 2200,
          modalPrice: 2100,
          unit: "Quintal",
          date: new Date().toISOString().split('T')[0]
        },
        {
          id: 3,
          state: "Gujarat",
          district: "Ahmedabad",
          market: "Ahmedabad APMC",
          commodity: "Cotton",
          variety: "Shankar-6",
          grade: "FAQ",
          minPrice: 5500,
          maxPrice: 6000,
          modalPrice: 5750,
          unit: "Quintal",
          date: new Date().toISOString().split('T')[0]
        }
      ],
      stats: {
        totalRecords: 3,
        lastFetchSuccess: true,
        lastFetchTime: new Date().toISOString(),
        averagePrice: 3533
      },
      lastUpdated: new Date().toISOString(),
      metadata: {
        source: 'mock_api',
        version: '1.0',
        fetchTime: new Date().toISOString()
      }
    };
    
    console.log(`✅ Fresh data fetched: ${mockData.prices.length} records`);
    return mockData;
    
  } catch (error) {
    console.error('❌ Error fetching fresh market data:', error);
    throw error;
  }
}

// Smart market data getter with weekly update logic
async function getMarketData() {
  try {
    // Try to read existing data
    const existingData = await readMarketData();
    
    if (existingData && existingData.lastUpdated) {
      const lastUpdate = new Date(existingData.lastUpdated);
      const now = new Date();
      
      // Check if we're in the same week as last update
      if (isSameWeek(lastUpdate, now)) {
        console.log('📅 Using cached data (same week)');
        return existingData;
      }
    }
    
    console.log('🔄 Fetching fresh data (new week or no existing data)');
    
    // Fetch fresh data
    const freshData = await fetchFreshMarketData();
    
    // Save it for future use
    await writeMarketData(freshData);
    
    return freshData;
    
  } catch (error: any) {
    console.error('❌ Error in getMarketData:', error);
    
    // Try to return existing data as fallback
    const existingData = await readMarketData();
    if (existingData) {
      console.log('📋 Returning cached data as fallback');
      return existingData;
    }
    
    // If no existing data, return minimal structure
    console.log('📋 Returning empty fallback data');
    return {
      prices: [],
      stats: {
        totalRecords: 0,
        lastFetchSuccess: false,
        error: error?.message || 'Unknown error'
      },
      lastUpdated: new Date().toISOString(),
      metadata: {
        source: 'error_fallback',
        error: error?.message || 'Unknown error'
      }
    };
  }
}

/**
 * GET /api/market-prices
 * Returns market prices with weekly update logic
 */
export async function GET(request: NextRequest) {
  try {
    // Get search params for filtering
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state');
    const commodity = searchParams.get('commodity');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log('📊 Market Prices API called with params:', { state, commodity, limit, offset });
    
    // Get market data using our smart weekly logic
    const marketData = await getMarketData();
    
    // Apply filters if provided
    let filteredPrices = marketData.prices;
    
    if (state && state !== 'all') {
      filteredPrices = filteredPrices.filter((price: any) => 
        price.state.toLowerCase().includes(state.toLowerCase())
      );
    }
    
    if (commodity && commodity !== 'all') {
      filteredPrices = filteredPrices.filter((price: any) => 
        price.commodity.toLowerCase().includes(commodity.toLowerCase())
      );
    }
    
    // Apply pagination
    const totalRecords = filteredPrices.length;
    const paginatedPrices = filteredPrices.slice(offset, offset + limit);
    
    // Calculate filtered stats
    const filteredStats = {
      ...marketData.stats,
      totalRecords,
      filteredRecords: paginatedPrices.length,
      averagePrice: paginatedPrices.length > 0 
        ? Math.round(paginatedPrices.reduce((sum: number, p: any) => sum + p.modalPrice, 0) / paginatedPrices.length)
        : 0,
      filters: { state, commodity },
      pagination: { limit, offset, hasMore: offset + limit < totalRecords }
    };
    
    const response = {
      success: true,
      data: {
        prices: paginatedPrices,
        stats: filteredStats,
        lastUpdated: marketData.lastUpdated,
        metadata: {
          ...marketData.metadata,
          requestTime: new Date().toISOString(),
          source: 'weekly_json_cache'
        }
      }
    };
    
    console.log(`✅ Returning ${paginatedPrices.length} filtered records out of ${totalRecords} total`);
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Market Prices API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch market prices',
      message: error?.message || 'Unknown error',
      data: {
        prices: [],
        stats: {
          totalRecords: 0,
          lastFetchSuccess: false,
          error: error?.message || 'Unknown error'
        },
        lastUpdated: new Date().toISOString(),
        metadata: {
          source: 'error_response',
          requestTime: new Date().toISOString()
        }
      }
    }, { status: 500 });
  }
}

/**
 * POST /api/market-prices
 * Force refresh market data (admin function)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Force refresh requested...');
    
    // Fetch fresh data regardless of day/week
    const freshData = await fetchFreshMarketData();
    
    // Save it
    await writeMarketData(freshData);
    
    console.log(`✅ Force refresh completed (${freshData.prices.length} records)`);
    
    return NextResponse.json({
      success: true,
      message: 'Market data refreshed successfully',
      data: {
        prices: freshData.prices,
        stats: freshData.stats,
        lastUpdated: freshData.lastUpdated || new Date().toISOString(),
        metadata: {
          ...freshData.metadata,
          forceRefresh: true,
          requestTime: new Date().toISOString()
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Force refresh error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh market data',
      message: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
