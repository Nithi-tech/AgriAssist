// /src/services/pricesService.ts

import { 
  PriceRecord, 
  DailyStateFile, 
  FiltersPayload, 
  MetaIndex, 
  PopularCommodities,
  QueryParams,
  QueryResponse,
  RefreshRequest,
  RefreshResponse
} from '@/types/marketPrices';
import {
  initDataDirectories,
  readDailyStateFile,
  writeDailyStateFile,
  readMetaIndex,
  writeMetaIndex,
  readPopularCommodities,
  writePopularCommodities,
  getAvailableDates,
  getAvailableStates
} from '@/lib/fsio';
import { getTodayISO, getMostRecentBusinessDayISO, getLastNDaysISO } from '@/lib/date';
import { 
  getUniqueValues, 
  searchFilter, 
  sortItems, 
  paginate,
  toKebabCase 
} from '@/lib/normalize';

// In-memory cache for frequently accessed data
const cache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * Get data from cache or return null if expired
 */
function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry;
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Set data in cache
 */
function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Initialize the prices service
 */
export async function initPricesService(): Promise<void> {
  await initDataDirectories();
  
  // Initialize meta index if it doesn't exist
  let metaIndex = await readMetaIndex();
  if (!metaIndex) {
    metaIndex = {
      last_updated: new Date().toISOString(),
      total_records: 0,
      states_count: 0,
      commodities_count: 0,
      districts_count: 0,
      markets_count: 0,
      available_dates: [],
      refresh_status: 'idle'
    };
    await writeMetaIndex(metaIndex);
  }
}

/**
 * Refresh price data for a specific day and states
 */
export async function refreshDay(
  dateISO: string = getTodayISO(),
  states: string[] | 'ALL' = 'ALL'
): Promise<RefreshResponse> {
  const startTime = Date.now();
  let success_count = 0;
  let error_count = 0;
  const errors: string[] = [];
  let targetStates: string[] = [];
  
  try {
    // Update meta index to show refresh is running
    const metaIndex = await readMetaIndex() || {};
    metaIndex.refresh_status = 'running';
    await writeMetaIndex(metaIndex);
    
    // Get list of states to process
    if (states === 'ALL') {
      targetStates = await getAvailableStates(dateISO);
    } else {
      targetStates = states;
    }
    
    console.log(`🔄 Starting refresh for ${targetStates.length} states on ${dateISO}`);
    
    // Process each state
    for (const state of targetStates) {
      try {
        console.log(`📊 Processing state: ${state}`);
        
        // Generate mock data since external API is not available
        const stateRecords: PriceRecord[] = [];
        
        // For now, return empty records as the external API is removed
        // This could be replaced with alternative data sources if needed
        
        const stateFile: DailyStateFile = {
          date: dateISO,
          state,
          total_records: stateRecords.length,
          records: stateRecords,
          last_updated_iso: new Date().toISOString(),
          fetch_status: stateRecords.length > 0 ? 'success' : 'partial'
        };
        
        // Save state file
        await writeDailyStateFile(dateISO, state, stateFile);
        
        success_count++;
        
        console.log(`✅ Saved ${stateRecords.length} records for ${state}`);
        
      } catch (error: any) {
        console.error(`❌ Error processing state ${state}:`, error.message);
        error_count++;
        errors.push(`${state}: ${error.message}`);
      }
    }
    
    // Update meta index with new statistics
    await updateMetaIndex();
    
    // Compute popular commodities for processed states
    for (let i = 0; i < targetStates.length; i++) {
      const state = targetStates[i];
      if (i < success_count) { // Only for successful states
        try {
          await updatePopularCommodities(state);
        } catch (error: any) {
          console.warn(`⚠️ Failed to update popular commodities for ${state}:`, error.message);
        }
      }
    }
    
    // Update meta index with final status
    const finalMeta = await readMetaIndex();
    if (finalMeta) {
      finalMeta.refresh_status = error_count === targetStates.length ? 'error' : 'idle';
      finalMeta.refresh_error = error_count === targetStates.length ? 
        `Failed to refresh any states: ${errors.join(', ')}` : 
        undefined;
      await writeMetaIndex(finalMeta);
    }
    
  } catch (error: any) {
    console.error('❌ Critical error during refresh:', error.message);
    error_count = targetStates.length || 1;
    success_count = 0;
    errors.push(error.message);
    
    // Update meta index with error status
    const metaIndex = await readMetaIndex();
    if (metaIndex) {
      metaIndex.refresh_status = 'error';
      metaIndex.refresh_error = error.message;
      await writeMetaIndex(metaIndex);
    }
  }
  
  const duration_ms = Date.now() - startTime;
  
  console.log(`🏁 Refresh completed in ${duration_ms}ms: ${success_count} success, ${error_count} errors`);
  
  // Return the new RefreshResponse format
  const response: RefreshResponse = {
    refresh_status: error_count === 0 ? 'completed' : (success_count > 0 ? 'completed' : 'failed'),
    message: error_count === 0 ? 'Refresh completed successfully' : 
             success_count > 0 ? 'Refresh completed with some errors' : 'Refresh failed',
    date: dateISO,
    states: Array.isArray(states) ? states : 'ALL',
    timestamp: new Date().toISOString(),
    result: {
      success_count,
      error_count,
      errors
    }
  };
  
  return response;
}

/**
 * Query price records with filters and pagination
 */
export async function queryPrices(params: QueryParams): Promise<QueryResponse> {
  const cacheKey = `query:${JSON.stringify(params)}`;
  const cached = getFromCache<QueryResponse>(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    // Collect records from all relevant states
    let allRecords: PriceRecord[] = [];
    
    if (params.state) {
      // Query specific state
      const stateFile = await readDailyStateFile(params.date, params.state);
      if (stateFile && stateFile.records) {
        allRecords = stateFile.records;
      }
    } else {
      // Query all available states for the date
      const availableStates = await getAvailableStates(params.date);
      
      for (const state of availableStates) {
        const stateFile = await readDailyStateFile(params.date, state);
        if (stateFile && stateFile.records) {
          allRecords.push(...stateFile.records);
        }
      }
    }
    
    // Apply filters
    let filteredRecords = allRecords;
    
    if (params.district) {
      filteredRecords = filteredRecords.filter(r => 
        r.district.toLowerCase().includes(params.district!.toLowerCase())
      );
    }
    
    if (params.market) {
      filteredRecords = filteredRecords.filter(r => 
        r.market.toLowerCase().includes(params.market!.toLowerCase())
      );
    }
    
    if (params.commodity) {
      filteredRecords = filteredRecords.filter(r => 
        r.commodity.toLowerCase().includes(params.commodity!.toLowerCase())
      );
    }
    
    if (params.variety) {
      filteredRecords = filteredRecords.filter(r => 
        r.variety?.toLowerCase().includes(params.variety!.toLowerCase())
      );
    }
    
    // Apply search filter
    if (params.q) {
      filteredRecords = searchFilter(filteredRecords, params.q, [
        'commodity', 'variety', 'market', 'district', 'state'
      ]);
    }
    
    // Apply sorting
    if (params.sortBy) {
      filteredRecords = sortItems(
        filteredRecords, 
        params.sortBy, 
        params.sortDir || 'asc'
      );
    }
    
    // Apply pagination
    const paginatedResult = paginate(
      filteredRecords,
      params.offset || 0,
      params.limit || 50
    );
    
    const response: QueryResponse = {
      total: paginatedResult.total,
      items: paginatedResult.items,
      page: paginatedResult.page,
      limit: paginatedResult.limit,
      has_more: paginatedResult.has_more,
      filters_applied: {
        date: params.date,
        state: params.state,
        district: params.district,
        market: params.market,
        commodity: params.commodity,
        variety: params.variety,
        search: params.q
      }
    };
    
    // Cache the result
    setCache(cacheKey, response);
    
    return response;
    
  } catch (error: any) {
    console.error('Error querying prices:', error);
    throw new Error(`Failed to query prices: ${error.message}`);
  }
}

/**
 * Get available filter options based on current selection
 */
export async function deriveFilters(params: {
  date: string;
  state?: string;
  district?: string;
  commodity?: string;
}): Promise<FiltersPayload> {
  const cacheKey = `filters:${JSON.stringify(params)}`;
  const cached = getFromCache<FiltersPayload>(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    // Get all records for the context
    let contextRecords: PriceRecord[] = [];
    
    if (params.state) {
      const stateFile = await readDailyStateFile(params.date, params.state);
      if (stateFile && stateFile.records) {
        contextRecords = stateFile.records;
        
        // Apply progressive filters
        if (params.district) {
          contextRecords = contextRecords.filter(r => 
            r.district.toLowerCase().includes(params.district!.toLowerCase())
          );
        }
        
        if (params.commodity) {
          contextRecords = contextRecords.filter(r => 
            r.commodity.toLowerCase().includes(params.commodity!.toLowerCase())
          );
        }
      }
    } else {
      // Get from all states
      const availableStates = await getAvailableStates(params.date);
      for (const state of availableStates) {
        const stateFile = await readDailyStateFile(params.date, state);
        if (stateFile && stateFile.records) {
          contextRecords.push(...stateFile.records);
        }
      }
    }
    
    const filters: FiltersPayload = {
      states: params.state ? 
        [params.state] : 
        getUniqueValues(contextRecords, 'state'),
      districts: getUniqueValues(contextRecords, 'district'),
      markets: getUniqueValues(contextRecords, 'market'),
      commodities: getUniqueValues(contextRecords, 'commodity'),
      varieties: getUniqueValues(
        contextRecords.filter(r => r.variety), 
        'variety'
      )
    };
    
    // Cache the result
    setCache(cacheKey, filters);
    
    return filters;
    
  } catch (error: any) {
    console.error('Error deriving filters:', error);
    // Return empty filters on error
    return {
      states: [],
      districts: [],
      markets: [],
      commodities: [],
      varieties: []
    };
  }
}

/**
 * Update meta index with current statistics
 */
async function updateMetaIndex(): Promise<void> {
  try {
    const availableDates = await getAvailableDates();
    let totalRecords = 0;
    const allStates = new Set<string>();
    const allCommodities = new Set<string>();
    const allDistricts = new Set<string>();
    const allMarkets = new Set<string>();
    
    // Aggregate statistics from all available data
    for (const date of availableDates.slice(0, 7)) { // Check last 7 days
      const states = await getAvailableStates(date);
      
      for (const state of states) {
        const stateFile = await readDailyStateFile(date, state);
        if (stateFile && stateFile.records) {
          totalRecords += stateFile.records.length;
          allStates.add(state);
          
          stateFile.records.forEach((record: PriceRecord) => {
            allCommodities.add(record.commodity);
            allDistricts.add(record.district);
            allMarkets.add(record.market);
          });
        }
      }
    }
    
    const metaIndex: MetaIndex = {
      last_updated: new Date().toISOString(),
      total_records: totalRecords,
      states_count: allStates.size,
      commodities_count: allCommodities.size,
      districts_count: allDistricts.size,
      markets_count: allMarkets.size,
      available_dates: availableDates,
      refresh_status: 'idle'
    };
    
    await writeMetaIndex(metaIndex);
    
  } catch (error: any) {
    console.error('Error updating meta index:', error);
  }
}

/**
 * Update popular commodities for a state
 */
async function updatePopularCommodities(state: string): Promise<void> {
  try {
    const last30Days = getLastNDaysISO(30);
    const commodityCounts = new Map<string, { count: number; totalPrice: number }>();
    
    // Aggregate data from last 30 days
    for (const date of last30Days) {
      const stateFile = await readDailyStateFile(date, state);
      if (stateFile && stateFile.records) {
        stateFile.records.forEach((record: PriceRecord) => {
          const existing = commodityCounts.get(record.commodity) || { count: 0, totalPrice: 0 };
          commodityCounts.set(record.commodity, {
            count: existing.count + 1,
            totalPrice: existing.totalPrice + record.modal_price
          });
        });
      }
    }
    
    // Sort by count and take top 20
    const topCommodities = Array.from(commodityCounts.entries())
      .map(([commodity, data]) => ({
        commodity,
        count: data.count,
        avg_modal_price: Math.round(data.totalPrice / data.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    const popularData: PopularCommodities = {
      state,
      computed_on: new Date().toISOString(),
      top: topCommodities
    };
    
    await writePopularCommodities(state, popularData);
    
  } catch (error: any) {
    console.error(`Error updating popular commodities for ${state}:`, error);
  }
}

/**
 * Get popular commodities for a state
 */
export async function getPopularCommoditiesForState(state: string): Promise<PopularCommodities | null> {
  try {
    return await readPopularCommodities(state);
  } catch (error: any) {
    console.error(`Error getting popular commodities for ${state}:`, error);
    return null;
  }
}

/**
 * Test connectivity and system health
 */
export async function testSystemHealth(): Promise<{
  ogd_api: boolean;
  file_system: boolean;
  cache: boolean;
  message: string;
}> {
  const health = {
    ogd_api: false,
    file_system: false,
    cache: false,
    message: ''
  };
  
  const messages: string[] = [];
  
  // External API connectivity removed
  try {
    health.ogd_api = false;
    messages.push('OGD API: Removed - External API functionality disabled');
  } catch (error: any) {
    messages.push(`OGD API: Failed - ${error.message}`);
  }
  
  // Test file system
  try {
    await initDataDirectories();
    const metaIndex = await readMetaIndex();
    health.file_system = true;
    messages.push(`File System: OK`);
  } catch (error: any) {
    messages.push(`File System: Failed - ${error.message}`);
  }
  
  // Test cache
  try {
    setCache('health_test', { test: true });
    const retrieved = getFromCache('health_test');
    health.cache = retrieved !== null;
    messages.push(`Cache: ${health.cache ? 'OK' : 'Failed'}`);
  } catch (error: any) {
    messages.push(`Cache: Failed - ${error.message}`);
  }
  
  health.message = messages.join('; ');
  
  return health;
}

/**
 * Get available filter options based on current selection context
 */
export async function getFilters(context: FiltersPayload = {}): Promise<FiltersPayload> {
  try {
    let meta: MetaIndex | null = null;
    
    try {
      meta = await readMetaIndex();
    } catch (error) {
      console.log('⚠️ No meta file found, returning empty filters');
      return {
        states: [],
        districts: [],
        markets: [],
        commodities: [],
        varieties: []
      };
    }
    
    // Get all available data for context building
    const allData: PriceRecord[] = [];
    
    // Load recent data (last 7 days) for filter context
    const recentDates = getLastNDaysISO(7);
    const availableDates = await getAvailableDates();
    
    for (const date of recentDates) {
      if (availableDates.includes(date)) {
        const statesForDate = await getAvailableStates(date);
        
        for (const state of statesForDate) {
          try {
            const stateData = await readDailyStateFile(date, state);
            allData.push(...stateData.records);
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }
    
    // Filter data based on context
    let filteredData = allData;
    
    if (context.states && context.states.length > 0) {
      filteredData = filteredData.filter((record: PriceRecord) => 
        context.states!.includes(record.state)
      );
    }
    
    if (context.districts && context.districts.length > 0) {
      filteredData = filteredData.filter((record: PriceRecord) => 
        context.districts!.includes(record.district)
      );
    }
    
    if (context.markets && context.markets.length > 0) {
      filteredData = filteredData.filter((record: PriceRecord) => 
        context.markets!.includes(record.market)
      );
    }
    
    if (context.commodities && context.commodities.length > 0) {
      filteredData = filteredData.filter((record: PriceRecord) => 
        context.commodities!.includes(record.commodity)
      );
    }
    
    // Extract unique values, filtering out undefined
    const states = [...new Set(filteredData.map((r: PriceRecord) => r.state).filter((s): s is string => Boolean(s)))].sort();
    const districts = [...new Set(filteredData.map((r: PriceRecord) => r.district).filter((d): d is string => Boolean(d)))].sort();
    const markets = [...new Set(filteredData.map((r: PriceRecord) => r.market).filter((m): m is string => Boolean(m)))].sort();
    const commodities = [...new Set(filteredData.map((r: PriceRecord) => r.commodity).filter((c): c is string => Boolean(c)))].sort();
    const varieties = [...new Set(filteredData.map((r: PriceRecord) => r.variety).filter((v): v is string => Boolean(v)))].sort();
    
    console.log(`🔍 Filter results: ${states.length} states, ${districts.length} districts, ${markets.length} markets, ${commodities.length} commodities, ${varieties.length} varieties`);
    
    return {
      states,
      districts,
      markets,
      commodities,
      varieties
    };
    
  } catch (error: any) {
    console.error('❌ Error getting filters:', error);
    throw new Error(`Failed to get filters: ${error.message}`);
  }
}
