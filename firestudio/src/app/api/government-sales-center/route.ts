/**
 * Government Sales Center API Route
 * Provides Mandi Information and Trader/Buyer data from eNAM
 */

import { NextRequest, NextResponse } from 'next/server';
import { getENAMMandiAndTraderData } from '../../../server/enam-sales-center-scraper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Parse query parameters
  const requestType = searchParams.get('type') || 'all'; // 'mandi', 'trader', or 'all'
  const limit = parseInt(searchParams.get('limit') || '50');

  console.log('Government Sales Center API called with type:', requestType);

  try {
    // Get mandi and trader data
    const data = await getENAMMandiAndTraderData();
    
    // Filter based on request type
    let response: any = {};
    
    switch (requestType) {
      case 'mandi':
        response = {
          success: true,
          data: {
            mandiInfo: data.mandiInfo.slice(0, limit),
            totalRecords: data.mandiInfo.length,
          },
          source: 'eNAM Mandi Directory',
          scrapedAt: data.scrapedAt
        };
        break;
        
      case 'trader':
        response = {
          success: true,
          data: {
            traderBuyerInfo: data.traderBuyerInfo.slice(0, limit),
            totalRecords: data.traderBuyerInfo.length,
          },
          source: 'eNAM Trader Directory',
          scrapedAt: data.scrapedAt
        };
        break;
        
      default: // 'all'
        response = {
          success: true,
          data: {
            mandiInfo: data.mandiInfo.slice(0, Math.ceil(limit / 2)),
            traderBuyerInfo: data.traderBuyerInfo.slice(0, Math.ceil(limit / 2)),
            totalRecords: data.totalRecords,
          },
          source: 'eNAM Directory Services',
          scrapedAt: data.scrapedAt
        };
    }

    console.log(`✅ Successfully returned ${response.data.totalRecords || data.totalRecords} records`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('❌ Government Sales Center API error:', error);
    
    const errorResponse = {
      success: false,
      error: {
        error: 'SCRAPING_FAILED',
        message: 'Failed to fetch mandi and trader information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      data: {
        mandiInfo: [],
        traderBuyerInfo: [],
        totalRecords: 0,
      },
      source: 'Error Response',
      scrapedAt: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestType = body.type || 'all';
    const limit = body.limit || 50;

    console.log('Government Sales Center POST API called with:', { requestType, limit });

    // Get mandi and trader data
    const data = await getENAMMandiAndTraderData();
    
    // Filter based on request type
    let response: any = {};
    
    switch (requestType) {
      case 'mandi':
        response = {
          success: true,
          data: {
            mandiInfo: data.mandiInfo.slice(0, limit),
            totalRecords: data.mandiInfo.length,
          },
          source: 'eNAM Mandi Directory',
          scrapedAt: data.scrapedAt
        };
        break;
        
      case 'trader':
        response = {
          success: true,
          data: {
            traderBuyerInfo: data.traderBuyerInfo.slice(0, limit),
            totalRecords: data.traderBuyerInfo.length,
          },
          source: 'eNAM Trader Directory',
          scrapedAt: data.scrapedAt
        };
        break;
        
      default: // 'all'
        response = {
          success: true,
          data: {
            mandiInfo: data.mandiInfo.slice(0, Math.ceil(limit / 2)),
            traderBuyerInfo: data.traderBuyerInfo.slice(0, Math.ceil(limit / 2)),
            totalRecords: data.totalRecords,
          },
          source: 'eNAM Directory Services',
          scrapedAt: data.scrapedAt
        };
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('❌ Government Sales Center POST API error:', error);
    
    const errorResponse = {
      success: false,
      error: {
        error: 'SCRAPING_FAILED',
        message: 'Failed to fetch mandi and trader information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      data: {
        mandiInfo: [],
        traderBuyerInfo: [],
        totalRecords: 0,
      },
      source: 'Error Response',
      scrapedAt: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
