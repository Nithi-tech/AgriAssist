// ============================================================================
// MARKET PRICES UPDATE API ROUTE
// Handles fetching and updating market price data from government sources
// Usage: POST /api/market-prices/update (manual trigger)
//        GET /api/market-prices/update (status check)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { 
  fetchMarketPricesFromSources, 
  upsertMarketPrices,
  refreshLatestPrices,
  type MarketPrice 
} from '@/lib/marketPricesApi';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

interface UpdateResult {
  success: boolean;
  message: string;
  data?: {
    totalFetched: number;
    totalUpserted: number;
    errors: string[];
    timestamp: string;
    sources: string[];
  };
  error?: string;
}

interface UpdateMarketPricesResponse {
  success: boolean;
  message: string;
  updatedCount: number;
  failedCount: number;
  errors: string[];
}

// ============================================================================
// API DATA SOURCES & SCRAPING CONFIGURATION
// ============================================================================

const API_SOURCES = [
  {
    name: 'agmarknet',
    url: 'https://agmarknet.gov.in/Others/profile.aspx',
    active: true
  },
  {
    name: 'data_gov_in',
    url: 'https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi',
    active: true
  }
];

const SCRAPING_TARGETS = [
  {
    state: 'Karnataka',
    url: 'https://raitamitra.karnataka.gov.in/marketPrice',
    selectors: {
      commodity: '.commodity-name',
      market: '.market-name', 
      minPrice: '.min-price',
      maxPrice: '.max-price',
      modalPrice: '.modal-price',
      date: '.price-date'
    }
  },
  {
    state: 'Maharashtra',
    url: 'https://mahaagrinet.gov.in/DailyPrices.aspx',
    selectors: {
      commodity: 'td:nth-child(2)',
      market: 'td:nth-child(1)',
      minPrice: 'td:nth-child(4)',
      maxPrice: 'td:nth-child(5)',
      modalPrice: 'td:nth-child(6)',
      date: 'td:nth-child(3)'
    }
  },
  {
    state: 'Tamil Nadu',
    url: 'https://tn.gov.in/crop-prices',
    selectors: {
      commodity: '.crop-name',
      market: '.market-location',
      minPrice: '.price-min',
      maxPrice: '.price-max',
      modalPrice: '.price-modal',
      date: '.price-date'
    }
  }
];

// ============================================================================
// DATA CLEANING & NORMALIZATION UTILITIES
// ============================================================================

function cleanPrice(priceStr: string): number | null {
  if (!priceStr) return null;
  
  const cleaned = priceStr.replace(/[₹,\s]/g, '').trim();
  
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    return parseFloat(parts[0]) || null;
  }
  
  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '');
}

function formatDate(dateStr: string): string {
  try {
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    if (dateStr.includes('-') && dateStr.length === 10) {
      const parts = dateStr.split('-');
      if (parts[0].length === 2) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    return new Date(dateStr).toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

// ============================================================================
// API DATA FETCHING WITH RETRY LOGIC
// ============================================================================

async function fetchApiData(source: any): Promise<any[]> {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting ${source.name} API fetch (attempt ${attempt})`);
      
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/html, */*',
        },
        //@ts-ignore
        timeout: 30000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${source.name} API fetch successful`);
      
      return Array.isArray(data) ? data : [data];
      
    } catch (error) {
      lastError = error;
      console.log(`❌ ${source.name} API attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }
  
  console.log(`🚫 ${source.name} API completely failed after ${maxRetries} attempts`);
  return [];
}

// ============================================================================
// WEB SCRAPING FALLBACK WITH ERROR HANDLING
// ============================================================================

async function scrapeMarketData(target: any): Promise<any[]> {
  try {
    console.log(`🕷️ Scraping ${target.state} market data from ${target.url}`);
    
    const response = await fetch(target.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      //@ts-ignore
      timeout: 20000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const marketData: any[] = [];
    
    $('table tr, .price-row, .market-item').each((index: number, element: any) => {
      try {
        const commodity = $(element).find(target.selectors.commodity).text().trim();
        const market = $(element).find(target.selectors.market).text().trim();
        const minPriceStr = $(element).find(target.selectors.minPrice).text().trim();
        const maxPriceStr = $(element).find(target.selectors.maxPrice).text().trim();
        const modalPriceStr = $(element).find(target.selectors.modalPrice).text().trim();
        const dateStr = $(element).find(target.selectors.date).text().trim();
        
        if (commodity && market) {
          marketData.push({
            state: target.state,
            district: 'Unknown',
            market: normalizeText(market),
            commodity: normalizeText(commodity),
            variety: null,
            unit: 'Quintal',
            min_price: cleanPrice(minPriceStr),
            max_price: cleanPrice(maxPriceStr),
            modal_price: cleanPrice(modalPriceStr),
            date: formatDate(dateStr),
            source: 'scraper'
          });
        }
      } catch (error) {
        console.log(`Error parsing row ${index}:`, error);
      }
    });
    
    console.log(`✅ Scraped ${marketData.length} records from ${target.state}`);
    return marketData;
    
  } catch (error) {
    console.log(`❌ Scraping failed for ${target.state}:`, error);
    return [];
  }
}

// ============================================================================
// MAIN DATA COLLECTION FUNCTION
// ============================================================================

async function collectMarketPrices(): Promise<any[]> {
  const allData: any[] = [];
  let apiSuccessCount = 0;
  
  // Try API sources first
  for (const source of API_SOURCES) {
    if (!source.active) continue;
    
    const apiData = await fetchApiData(source);
    if (apiData.length > 0) {
      apiSuccessCount++;
      allData.push(...apiData.map(item => ({
        ...item,
        source: 'api',
        date: formatDate(item.date || new Date().toISOString())
      })));
    }
  }
  
  // If API sources fail, use scraping fallbacks
  if (apiSuccessCount === 0) {
    console.log('🔄 APIs failed, using scraping fallbacks...');
    
    for (const target of SCRAPING_TARGETS) {
      const scrapedData = await scrapeMarketData(target);
      allData.push(...scrapedData);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(`📊 Total collected: ${allData.length} market price records`);
  return allData;
}

// ============================================================================
// SUPABASE UPSERT WITH CONFLICT RESOLUTION
// ============================================================================

async function upsertToSupabase(data: any[]): Promise<{ success: number; failed: number; errors: string[] }> {
  const results: { success: number; failed: number; errors: string[] } = { success: 0, failed: 0, errors: [] };
  
  const batchSize = 100;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    try {
      const { error } = await supabaseAdmin
        .from('market_prices')
        .upsert(batch, {
          onConflict: 'state,market,commodity,date',
          ignoreDuplicates: false
        });
      
      if (error) {
        results.failed += batch.length;
        results.errors.push(`Batch ${i}-${i + batch.length}: ${error.message}`);
      } else {
        results.success += batch.length;
      }
      
    } catch (error) {
      results.failed += batch.length;
      results.errors.push(`Batch ${i}-${i + batch.length}: ${String(error)}`);
    }
  }
  
  return results;
}

// ============================================================================
// UPDATE MARKET PRICES (POST)
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<UpdateMarketPricesResponse>> {
  console.log('🚀 Market prices update API called');

  try {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isAuthorized = authHeader === `Bearer ${cronSecret}` || 
                        process.env.NODE_ENV === 'development';

    if (!isAuthorized) {
      return NextResponse.json({
        success: false,
        updatedCount: 0,
        failedCount: 0,
        errors: ['Unauthorized access'],
        message: 'Invalid authorization'
      }, { status: 401 });
    }

    console.log('🚀 Starting market prices update process...');
    
    // Collect data from all sources
    const collectedData = await collectMarketPrices();
    
    if (collectedData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No market price data could be collected from any source',
        updatedCount: 0,
        failedCount: 0,
        errors: ['All data sources failed']
      }, { status: 500 });
    }
    
    // Clean and validate data
    const validData = collectedData.filter(item => 
      item.commodity && 
      item.market && 
      item.state &&
      (item.min_price || item.max_price || item.modal_price)
    );
    
    console.log(`✅ Cleaned data: ${validData.length}/${collectedData.length} records valid`);
    
    // Upsert to Supabase
    const upsertResults = await upsertToSupabase(validData);
    
    return NextResponse.json({
      success: true,
      message: `Market prices updated successfully. ${upsertResults.success} inserted/updated, ${upsertResults.failed} failed.`,
      updatedCount: upsertResults.success,
      failedCount: upsertResults.failed,
      errors: upsertResults.errors
    });
    
  } catch (error) {
    console.error('❌ Market prices update error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update market prices',
      updatedCount: 0,
      failedCount: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    }, { status: 500 });
  }
}

// ============================================================================
// GET ENDPOINT FOR STATUS CHECK
// ============================================================================

export async function GET(): Promise<NextResponse<UpdateResult>> {
  try {
    // Return last update status and basic info
    const result: UpdateResult = {
      success: true,
      message: 'Market prices update API is operational',
      data: {
        totalFetched: 0,
        totalUpserted: 0,
        errors: [],
        timestamp: new Date().toISOString(),
        sources: ['Agmarknet', 'Data.gov.in', 'State Marketing Boards']
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error getting update status:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to get update status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createCronJobUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/market-prices/update`;
}

export function generateCronCommand(): string {
  const cronSecret = process.env.CRON_SECRET;
  const url = createCronJobUrl();
  
  return `curl -X POST "${url}" \\
    -H "Authorization: Bearer ${cronSecret}" \\
    -H "Content-Type: application/json"`;
}

// Export configuration for Vercel Cron Jobs
export const config = {
  // Run daily at 6:00 AM IST (00:30 UTC)
  cron: '0 0 6 * * *',
  
  // Maximum execution time (10 minutes for large data processing)
  maxDuration: 600,
  
  // Memory allocation
  memory: 256,
  
  // Regions
  regions: ['bom1'], // Mumbai region for better latency with Indian APIs
};
