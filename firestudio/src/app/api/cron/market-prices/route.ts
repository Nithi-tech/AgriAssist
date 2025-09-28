// ============================================================================
// MARKET PRICES CRON JOB CONFIGURATION
// Automatic scheduled updates for market price data
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// CRON JOB ENDPOINT
// Vercel Cron Jobs or external cron services can call this endpoint
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('❌ Unauthorized cron job request');
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 });
    }
    
    console.log('🔄 Starting scheduled market prices update...');
    
    // Call the update API internally
    const updateResponse = await fetch(`${process.env.NEXTJS_URL}/api/market-prices/update-new`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });
    
    const updateResult = await updateResponse.json();
    
    if (!updateResult.success) {
      throw new Error(updateResult.message || 'Update failed');
    }
    
    console.log('✅ Scheduled market prices update completed:', {
      updated: updateResult.updatedCount,
      failed: updateResult.failedCount
    });
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled update completed successfully',
      data: {
        timestamp: new Date().toISOString(),
        updatedRecords: updateResult.updatedCount,
        failedRecords: updateResult.failedCount,
        errors: updateResult.errors || []
      }
    });
    
  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Cron job failed',
      error: error.message || String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// ============================================================================
// MANUAL TRIGGER (POST)
// For manual testing of the cron job
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual cron job trigger requested');
    
    // In development, allow manual triggers without auth
    if (process.env.NODE_ENV === 'development') {
      const result = await GET(request);
      return result;
    }
    
    return NextResponse.json({
      success: false,
      message: 'Manual triggers only allowed in development mode'
    }, { status: 403 });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Manual trigger failed',
      error: error.message || String(error)
    }, { status: 500 });
  }
}
