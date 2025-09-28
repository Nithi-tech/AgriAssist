// /src/app/api/prices/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { queryPrices, initPricesService } from '@/services/pricesService';
import { QueryParams } from '@/types/marketPrices';
import { getTodayISO } from '@/lib/date';

// Initialize service
let isInitialized = false;

async function ensureInitialized() {
  if (!isInitialized) {
    await initPricesService();
    isInitialized = true;
  }
}

/**
 * GET /api/prices - Query price records with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const params: QueryParams = {
      date: searchParams.get('date') || getTodayISO(),
      state: searchParams.get('state') || undefined,
      district: searchParams.get('district') || undefined,
      market: searchParams.get('market') || undefined,
      commodity: searchParams.get('commodity') || undefined,
      variety: searchParams.get('variety') || undefined,
      q: searchParams.get('q') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      sortBy: (searchParams.get('sortBy') as any) || 'modal_price',
      sortDir: (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc'
    };
    
    // Validate parameters
    if (params.limit && params.limit > 1000) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 1000' },
        { status: 400 }
      );
    }
    
    if (params.offset && params.offset < 0) {
      return NextResponse.json(
        { error: 'Offset cannot be negative' },
        { status: 400 }
      );
    }
    
    console.log(`📊 Prices API query:`, {
      date: params.date,
      state: params.state || 'all',
      filters: {
        district: params.district,
        commodity: params.commodity,
        search: params.q
      },
      pagination: {
        limit: params.limit,
        offset: params.offset
      }
    });
    
    const result = await queryPrices(params);
    
    console.log(`✅ Returning ${result.items.length} items out of ${result.total} total`);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('❌ Error in prices API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to query prices',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/prices/export - Export current query results as CSV or JSON
 */
export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const body = await request.json();
    const { format, params } = body;
    
    if (!format || !['csv', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Format must be "csv" or "json"' },
        { status: 400 }
      );
    }
    
    // Get all matching records (no pagination for export)
    const exportParams: QueryParams = {
      ...params,
      limit: 10000, // Large limit for export
      offset: 0
    };
    
    const result = await queryPrices(exportParams);
    
    if (format === 'csv') {
      // Convert to CSV
      const headers = [
        'State', 'District', 'Market', 'Commodity', 'Variety',
        'Min Price (₹)', 'Modal Price (₹)', 'Max Price (₹)', 'Date'
      ];
      
      const csvRows = [
        headers.join(','),
        ...result.items.map(item => [
          `"${item.state}"`,
          `"${item.district}"`,
          `"${item.market}"`,
          `"${item.commodity}"`,
          `"${item.variety || ''}"`,
          item.min_price,
          item.modal_price,
          item.max_price,
          item.date
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="market-prices-${params.date}.csv"`
        }
      });
      
    } else {
      // Return JSON
      return new NextResponse(JSON.stringify(result.items, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="market-prices-${params.date}.json"`
        }
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error in prices export API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export prices',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
