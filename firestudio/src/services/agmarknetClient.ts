// /src/services/agmarknetClient.ts

import { OgdApiParams, OgdApiResponse, OgdApiRecord, PriceRecord } from '@/types/marketPrices';
import { toOgdDateFormat, fromOgdDateFormat } from '@/lib/date';
import { normalizePriceRecord, validatePriceRecord, parsePrice } from '@/lib/normalize';

const OGD_BASE_URL = 'https://api.data.gov.in/resource';
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const DEFAULT_LIMIT = 500;
const MAX_RETRIES = 3;
const RATE_LIMIT_DELAY = 500; // 2 requests per second

interface FetchOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

/**
 * Sleep for given milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10 seconds
}

/**
 * Fetch with timeout and retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit & FetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, retries = MAX_RETRIES, signal, ...fetchOptions } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Combine signals if both exist
      const combinedSignal = signal ? 
        (() => {
          if (signal.aborted) controller.abort();
          signal.addEventListener('abort', () => controller.abort());
          return controller.signal;
        })() : 
        controller.signal;
      
      const response = await fetch(url, {
        ...fetchOptions,
        signal: combinedSignal
      });
      
      clearTimeout(timeoutId);
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : getBackoffDelay(attempt);
        
        if (attempt < retries) {
          console.log(`🕒 Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`);
          await sleep(delay);
          continue;
        }
      }
      
      // Handle other errors that should trigger retry
      if (response.status >= 500 && attempt < retries) {
        console.log(`🔄 Server error ${response.status}, retrying in ${getBackoffDelay(attempt)}ms`);
        await sleep(getBackoffDelay(attempt));
        continue;
      }
      
      return response;
      
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on abort
      if (error.name === 'AbortError') {
        throw error;
      }
      
      if (attempt < retries) {
        const delay = getBackoffDelay(attempt);
        console.log(`🔄 Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1}):`, error.message);
        await sleep(delay);
        continue;
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Build OGD API URL with parameters
 */
function buildOgdUrl(params: Partial<OgdApiParams>): string {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    throw new Error('DATA_GOV_API_KEY environment variable is required');
  }
  
  const urlParams = new URLSearchParams({
    'api-key': apiKey,
    format: 'json',
    offset: params.offset?.toString() || '0',
    limit: params.limit?.toString() || DEFAULT_LIMIT.toString(),
    ...Object.fromEntries(
      Object.entries(params)
        .filter(([key, value]) => value !== undefined && key !== 'offset' && key !== 'limit')
        .map(([key, value]) => [key, value.toString()])
    )
  });
  
  return `${OGD_BASE_URL}/${RESOURCE_ID}?${urlParams.toString()}`;
}

/**
 * Map OGD API record to internal PriceRecord format
 */
function mapOgdRecordToPriceRecord(record: OgdApiRecord): PriceRecord | null {
  try {
    const mapped = {
      state: record.state || '',
      district: record.district || '',
      market: record.market || '',
      commodity: record.commodity || '',
      variety: record.variety || undefined,
      min_price: parsePrice(record.min_price),
      max_price: parsePrice(record.max_price),
      modal_price: parsePrice(record.modal_price),
      date: record.price_date ? fromOgdDateFormat(record.price_date) : '',
      source: 'ogd' as const,
      grade: record.grade || undefined
    };
    
    // Normalize and validate
    const normalized = normalizePriceRecord(mapped);
    
    if (!validatePriceRecord(normalized)) {
      return null;
    }
    
    return normalized as PriceRecord;
  } catch (error) {
    console.warn('Failed to map OGD record:', error, record);
    return null;
  }
}

/**
 * Fetch single page of price data from OGD API
 */
export async function fetchOgdPricePage(params: {
  state?: string;
  district?: string;
  commodity?: string;
  market?: string;
  date?: string; // ISO format YYYY-MM-DD
  offset: number;
  limit: number;
}, options: FetchOptions = {}): Promise<PriceRecord[]> {
  
  // Apply rate limiting
  await sleep(RATE_LIMIT_DELAY);
  
  const ogdParams: Partial<OgdApiParams> = {
    offset: params.offset,
    limit: params.limit
  };
  
  // Add filters if provided
  if (params.state) ogdParams['filters[state]'] = params.state;
  if (params.district) ogdParams['filters[district]'] = params.district;
  if (params.commodity) ogdParams['filters[commodity]'] = params.commodity;
  if (params.market) ogdParams['filters[market]'] = params.market;
  if (params.date) ogdParams['filters[date]'] = toOgdDateFormat(params.date);
  
  const url = buildOgdUrl(ogdParams);
  
  try {
    console.log(`🌐 Fetching OGD data: offset=${params.offset}, limit=${params.limit}, state=${params.state || 'all'}`);
    
    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AgriAssist/1.0 (Market Price Service)'
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`OGD API error: ${response.status} ${response.statusText}`);
    }
    
    const data: OgdApiResponse = await response.json();
    
    if (!data.records || !Array.isArray(data.records)) {
      console.warn('Invalid response format from OGD API:', data);
      return [];
    }
    
    // Map and filter valid records
    const validRecords = data.records
      .map(mapOgdRecordToPriceRecord)
      .filter((record): record is PriceRecord => record !== null);
    
    console.log(`✅ Fetched ${validRecords.length} valid records from ${data.records.length} total`);
    
    return validRecords;
    
  } catch (error: any) {
    console.error(`❌ Failed to fetch OGD data for offset ${params.offset}:`, error.message);
    throw error;
  }
}

/**
 * Fetch all price data for given parameters (handles pagination automatically)
 */
export async function fetchAllOgdPrices(params: {
  state?: string;
  district?: string;
  commodity?: string;
  market?: string;
  date?: string; // ISO format YYYY-MM-DD
  maxRecords?: number; // Safety limit
}, options: FetchOptions = {}): Promise<PriceRecord[]> {
  
  const allRecords: PriceRecord[] = [];
  const limit = DEFAULT_LIMIT;
  const maxRecords = params.maxRecords || 50000; // Safety limit
  let offset = 0;
  let hasMore = true;
  
  console.log(`🔄 Starting paginated fetch for state: ${params.state || 'all'}, date: ${params.date || 'all'}`);
  
  while (hasMore && allRecords.length < maxRecords) {
    try {
      const pageRecords = await fetchOgdPricePage({
        ...params,
        offset,
        limit
      }, options);
      
      if (pageRecords.length === 0) {
        hasMore = false;
        break;
      }
      
      allRecords.push(...pageRecords);
      offset += limit;
      
      // If we got fewer records than the limit, we've reached the end
      if (pageRecords.length < limit) {
        hasMore = false;
      }
      
      // Safety check
      if (allRecords.length >= maxRecords) {
        console.warn(`⚠️ Reached maximum record limit (${maxRecords}), stopping fetch`);
        hasMore = false;
      }
      
    } catch (error: any) {
      // If this is an abort signal, stop immediately
      if (error.name === 'AbortError') {
        throw error;
      }
      
      // For other errors, log and continue if we have some data
      console.error(`❌ Error fetching page at offset ${offset}:`, error.message);
      
      if (allRecords.length === 0) {
        // If we have no data at all, re-throw the error
        throw error;
      } else {
        // If we have some data, break the loop and return what we have
        console.log(`⚠️ Partial fetch completed with ${allRecords.length} records due to error`);
        break;
      }
    }
  }
  
  console.log(`✅ Completed fetch: ${allRecords.length} total records for state: ${params.state || 'all'}`);
  
  return allRecords;
}

/**
 * Test OGD API connectivity and authentication
 */
export async function testOgdConnectivity(): Promise<{
  success: boolean;
  message: string;
  sampleRecords?: number;
}> {
  try {
    const testRecords = await fetchOgdPricePage({
      offset: 0,
      limit: 5 // Just test with a small number
    }, {
      timeout: 10000,
      retries: 1
    });
    
    return {
      success: true,
      message: 'OGD API connection successful',
      sampleRecords: testRecords.length
    };
  } catch (error: any) {
    return {
      success: false,
      message: `OGD API connection failed: ${error.message}`
    };
  }
}

/**
 * Get available states from OGD API (fetch a sample and extract unique states)
 */
export async function getAvailableStatesFromOgd(): Promise<string[]> {
  try {
    // Fetch a larger sample to get diverse state data
    const sampleRecords = await fetchOgdPricePage({
      offset: 0,
      limit: 1000
    }, {
      timeout: 15000,
      retries: 2
    });
    
    const states = [...new Set(sampleRecords.map(record => record.state))]
      .filter(state => state && state.trim())
      .sort();
    
    console.log(`📊 Found ${states.length} unique states in OGD data:`, states);
    
    return states;
  } catch (error: any) {
    console.error('Failed to get available states from OGD:', error.message);
    // Return fallback list of major states
    return [
      'Assam', 'Delhi', 'Tamil Nadu', 'Telangana', 'Gujarat', 'Karnataka',
      'Maharashtra', 'Punjab', 'Haryana', 'Rajasthan', 'Uttar Pradesh',
      'Madhya Pradesh', 'Bihar', 'West Bengal', 'Odisha', 'Andhra Pradesh'
    ];
  }
}
