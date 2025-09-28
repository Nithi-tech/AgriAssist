// ============================================================================
// MARKET PRICES API INTEGRATION LIBRARY
// Handles fetching market price data from government sources
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface MarketPrice {
  id?: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  unit: string;
  min_price?: number;
  max_price?: number;
  modal_price: number;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface MarketPriceFilter {
  state?: string;
  commodity?: string;
  district?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface MarketPriceStats {
  totalRecords: number;
  totalStates: number;
  totalCommodities: number;
  lastUpdated: string;
  priceRange: {
    lowest: { commodity: string; price: number; state: string };
    highest: { commodity: string; price: number; state: string };
  };
}

// ============================================================================
// DATA SOURCES CONFIGURATION
// ============================================================================

const DATA_SOURCES = {
  // Primary: Agmarknet API (if available)
  AGMARKNET: {
    baseUrl: 'https://agmarknet.gov.in/SearchCmmMkt.aspx',
    method: 'scraping', // API not publicly available
    rateLimitMs: 2000, // 2 seconds between requests
  },
  
  // Secondary: Data.gov.in datasets
  DATA_GOV_IN: {
    baseUrl: 'https://api.data.gov.in/resource',
    apiKey: process.env.DATA_GOV_IN_API_KEY,
    rateLimitMs: 1000,
  },
  
  // Fallback: Mock data for development
  MOCK: {
    enabled: process.env.NODE_ENV === 'development',
  }
};

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// ============================================================================

const MOCK_MARKET_DATA: MarketPrice[] = [
  {
    state: 'Maharashtra',
    district: 'Pune',
    market: 'Pune APMC',
    commodity: 'Onion',
    variety: 'Red',
    unit: 'Quintal',
    min_price: 1800,
    max_price: 2200,
    modal_price: 2000,
    date: new Date().toISOString().split('T')[0],
  },
  {
    state: 'Punjab',
    district: 'Ludhiana',
    market: 'Ludhiana Mandi',
    commodity: 'Wheat',
    variety: 'PBW-343',
    unit: 'Quintal',
    min_price: 2800,
    max_price: 3200,
    modal_price: 3000,
    date: new Date().toISOString().split('T')[0],
  },
  {
    state: 'West Bengal',
    district: 'Kolkata',
    market: 'Kolkata Market',
    commodity: 'Rice',
    variety: 'IR-64',
    unit: 'Quintal',
    min_price: 2200,
    max_price: 2800,
    modal_price: 2500,
    date: new Date().toISOString().split('T')[0],
  },
  {
    state: 'Tamil Nadu',
    district: 'Chennai',
    market: 'Koyambedu Market',
    commodity: 'Tomato',
    variety: 'Hybrid',
    unit: 'Quintal',
    min_price: 1200,
    max_price: 1800,
    modal_price: 1500,
    date: new Date().toISOString().split('T')[0],
  },
  {
    state: 'Karnataka',
    district: 'Bangalore',
    market: 'KR Market',
    commodity: 'Potato',
    variety: 'White',
    unit: 'Quintal',
    min_price: 1600,
    max_price: 2000,
    modal_price: 1800,
    date: new Date().toISOString().split('T')[0],
  },
];

// ============================================================================
// API FUNCTIONS
// ============================================================================

export async function fetchMarketPricesFromSources(): Promise<MarketPrice[]> {
  console.log('🔄 Starting market price data fetch...');
  
  try {
    // For development, use mock data
    if (DATA_SOURCES.MOCK.enabled) {
      console.log('📋 Using mock data for development');
      return MOCK_MARKET_DATA;
    }

    // In production, implement actual API calls
    const marketData: MarketPrice[] = [];

    // TODO: Implement actual API integration
    // For now, return enriched mock data with current date
    const enrichedData = MOCK_MARKET_DATA.map(item => ({
      ...item,
      date: new Date().toISOString().split('T')[0],
    }));

    console.log(`✅ Fetched ${enrichedData.length} market price records`);
    return enrichedData;

  } catch (error) {
    console.error('❌ Error fetching market prices:', error);
    throw error;
  }
}

export async function upsertMarketPrices(prices: MarketPrice[]): Promise<{
  success: boolean;
  inserted: number;
  updated: number;
  errors: any[];
}> {
  console.log(`🔄 Upserting ${prices.length} market price records...`);
  
  try {
    const { data, error } = await supabase
      .from('market_prices')
      .upsert(prices, {
        onConflict: 'state,district,market,commodity,variety,date',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('❌ Supabase upsert error:', error);
      throw error;
    }

    console.log(`✅ Successfully upserted ${data?.length || 0} records`);
    
    return {
      success: true,
      inserted: data?.length || 0,
      updated: 0, // Supabase doesn't distinguish between insert/update in upsert
      errors: []
    };

  } catch (error) {
    console.error('❌ Error upserting market prices:', error);
    return {
      success: false,
      inserted: 0,
      updated: 0,
      errors: [error]
    };
  }
}

export async function getMarketPrices(filters?: MarketPriceFilter): Promise<MarketPrice[]> {
  try {
    let query = supabase
      .from('market_prices')
      .select('*');

    // Apply filters
    if (filters?.state) {
      query = query.eq('state', filters.state);
    }
    if (filters?.commodity) {
      query = query.ilike('commodity', `%${filters.commodity}%`);
    }
    if (filters?.district) {
      query = query.eq('district', filters.district);
    }
    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('date', filters.dateTo);
    }

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
    }

    // Order by date desc, then by commodity
    query = query.order('date', { ascending: false }).order('commodity');

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching market prices:', error);
      throw error;
    }

    return data || [];

  } catch (error) {
    console.error('❌ Error in getMarketPrices:', error);
    throw error;
  }
}

export async function getMarketPriceStats(): Promise<MarketPriceStats> {
  try {
    // Get total records count
    const { count: totalRecords } = await supabase
      .from('market_prices')
      .select('*', { count: 'exact', head: true });

    // Get unique states count
    const { data: statesData } = await supabase
      .from('market_prices')
      .select('state')
      .order('state');

    const uniqueStates = statesData ? [...new Set(statesData.map(item => item.state))].length : 0;

    // Get unique commodities count
    const { data: commoditiesData } = await supabase
      .from('market_prices')
      .select('commodity')
      .order('commodity');

    const uniqueCommodities = commoditiesData ? [...new Set(commoditiesData.map(item => item.commodity))].length : 0;

    // Get last updated date
    const { data: lastUpdatedData } = await supabase
      .from('market_prices')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    // Get price range
    const { data: priceRangeData } = await supabase
      .from('market_prices')
      .select('commodity, modal_price, state')
      .order('modal_price', { ascending: true });

    const lowest = priceRangeData?.[0];
    const highest = priceRangeData?.[priceRangeData.length - 1];

    return {
      totalRecords: totalRecords || 0,
      totalStates: uniqueStates,
      totalCommodities: uniqueCommodities,
      lastUpdated: lastUpdatedData?.[0]?.updated_at || new Date().toISOString(),
      priceRange: {
        lowest: {
          commodity: lowest?.commodity || 'N/A',
          price: lowest?.modal_price || 0,
          state: lowest?.state || 'N/A'
        },
        highest: {
          commodity: highest?.commodity || 'N/A',
          price: highest?.modal_price || 0,
          state: highest?.state || 'N/A'
        }
      }
    };

  } catch (error) {
    console.error('❌ Error getting market price stats:', error);
    throw error;
  }
}

export async function refreshLatestPrices(): Promise<void> {
  try {
    console.log('🔄 Refreshing latest market prices view...');
    
    const { error } = await supabase.rpc('refresh_latest_market_prices');
    
    if (error) {
      console.error('❌ Error refreshing latest prices:', error);
      throw error;
    }
    
    console.log('✅ Latest market prices view refreshed');
    
  } catch (error) {
    console.error('❌ Error in refreshLatestPrices:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatPrice(price: number, unit: string = 'Quintal'): string {
  return `₹${price.toLocaleString('en-IN')}/${unit}`;
}

export function getPriceChange(currentPrice: number, previousPrice: number): {
  change: number;
  percentage: number;
  trend: 'up' | 'down' | 'same';
} {
  const change = currentPrice - previousPrice;
  const percentage = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
  
  return {
    change,
    percentage,
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
  };
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export const COMMON_COMMODITIES = [
  'Wheat', 'Rice', 'Maize', 'Barley', 'Gram', 'Tur/Arhar', 'Moong', 'Urad',
  'Masoor', 'Groundnut', 'Sunflower', 'Soybean', 'Sesamum', 'Niger', 'Safflower',
  'Castor seed', 'Cotton', 'Jute', 'Sugarcane', 'Onion', 'Potato', 'Tomato',
  'Brinjal', 'Cabbage', 'Cauliflower', 'Okra', 'Chili', 'Turmeric', 'Coriander'
];
