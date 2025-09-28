// app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sensorService } from '@/lib/sensorService';

export async function GET(request: NextRequest) {
  try {
    const alerts = await sensorService.getActiveAlerts();

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch alerts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, action } = body;

    if (!alertId || action !== 'acknowledge') {
      return NextResponse.json(
        { success: false, error: 'Invalid alert action or missing alertId' },
        { status: 400 }
      );
    }

    await sensorService.acknowledgeAlert(alertId);

    return NextResponse.json({
      success: true,
      message: 'Alert acknowledged successfully'
    });

  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update alert',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
